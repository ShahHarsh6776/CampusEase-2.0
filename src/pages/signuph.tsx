import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/supabase/supabaseClient';
import { Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { useUser } from '../UserContext';


const studentIdPattern = /^[2][0-5](dit|dce|dcs|it|ce|cs)\d{3}$/i;
const facultyIdPattern = /^fac_(dit|dce|dcs|it|ce|cs)\d{3}$/i;
// Faculty ID format: fac_<department>_<number> (case-insensitive)

const adminIdPattern = /^admin\d{3}$/i;
// Admin ID format: admin_<number> (case-insensitive)

  // Student ID format (case insensitive)
// Student email pattern (ID is the student ID)
const studentEmailPattern = (id: string) => new RegExp(`^${id}@charusat.edu.in$`, 'i');

// Faculty email pattern (ID is the faculty ID, i.e., facId)
const facultyEmailPattern = (id: string) => new RegExp(`^${id}@charusat.ac.in$`, 'i');

// Admin email pattern (ID is the admin ID, format: adminId_ad)
const adminEmailPattern = (id: string) => new RegExp(`^${id}_ad@charusat.ac.in$`, 'i');






const Signup = () => {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  // const { setUserData } = useUser();

  let course = "";

  if (userId.toLowerCase().includes("dit")) {
    course = "Information Technology";
  } else if (userId.toLowerCase().includes("dcs")) {
    course = "Computer Science";
  } else if (userId.toLowerCase().includes("dce")) {
    course = "Computer Engineering";
  } else {
    course = "Unknown"; // fallback (optional)
  }


  const validateStep1 = () => {
    if (!firstName || !lastName || !userId || !email || !password || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill out all fields',
        variant: 'destructive',
      });
      return false;
    }
  
     // Validate student, faculty, or admin ID format
  if (!studentIdPattern.test(userId) && !facultyIdPattern.test(userId) && !adminIdPattern.test(userId)) {
    toast({
      title: 'Invalid ID',
      description: 'Please enter a valid ID (Student, Faculty, or Admin)',
      variant: 'destructive',
    });
    return false;
  }

  // Validate email format based on ID (student, faculty, or admin)
  let emailPattern: RegExp;
  if (studentIdPattern.test(userId)) {
    emailPattern = studentEmailPattern(userId);
  } else if (facultyIdPattern.test(userId)) {
    emailPattern = facultyEmailPattern(userId);
  } else if (adminIdPattern.test(userId)) {
    emailPattern = adminEmailPattern(userId);
  } else {
    toast({
      title: 'Invalid Email',
      description: 'Email does not match the ID format',
      variant: 'destructive',
    });
    return false;
  }

  if (!emailPattern.test(email)) {
    toast({
      title: 'Invalid Email',
      description: 'Your email must match your ID format',
      variant: 'destructive',
    });
    return false;
  }
  
    // Check if passwords match
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return false;
    }
  
    if (password.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      });
      return false;
    }
  
    return true;
  };
  


  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setLoading(true);
  
    try {
      // Step 1: Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            fname: firstName,
            lname: lastName,
            user_id: userId,
            role: studentIdPattern.test(userId) && studentEmailPattern(userId).test(email) ? 'student' :
                  facultyIdPattern.test(userId) && facultyEmailPattern(userId).test(email) ? 'faculty' : 
                  adminIdPattern.test(userId) && adminEmailPattern(userId).test(email) ? 'admin' : 'user',
          },
        },
      });
  
      if (error) {
        throw error;
      }
  
      const user = data.user;
      let filePath = null;
      let  publicUrl = null;
      // Upload photo if available
      if (photo && user) {
        const fileExt = photo.name.split('.').pop();
        filePath = `profile-pic/profile-pics/${user.id}.${fileExt}`;

      
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-pic')
          .upload(filePath, photo, {
            cacheControl: '3600',
            upsert: true,
          });
  
        if (uploadError) {
          console.error('Upload failed:', uploadError.message, uploadError);
          throw new Error('File upload failed');
        }
  
        //gETTING IMAGE URL
        const { data: publicUrlData } = await supabase
        .storage
        .from('profile-pic')
        .getPublicUrl(filePath);
        

      publicUrl = publicUrlData.publicUrl;



        // Update photo_path based on role
        const table = determineTableBasedOnRole(userId, email);
        await supabase
          .from(table)
          .update({  profile_photo: publicUrl })
          .eq('id', user.id);
      }
  
      // Step 2: Calculate verification expiry date (24 hours from created_at)
      const verificationExpiry = new Date();
      verificationExpiry.setHours(verificationExpiry.getHours() + 24); // Adds 24 hours
  
      // Determine which table to insert based on the role
      const table = determineTableBasedOnRole(userId, email);
  
      // Step 3: Insert user data into the appropriate table based on role
      if (user) {

              const role = studentIdPattern.test(userId) && studentEmailPattern(userId).test(email)
          ? 'student'
          : facultyIdPattern.test(userId) && facultyEmailPattern(userId).test(email)
          ? 'faculty'
          : 'admin';

          const insertData: any = {
            id: user.id,
            user_id: userId,
            fname: firstName,
            lname: lastName,
            email: email,
            has_photo: !!filePath,
            profile_photo: publicUrl,
            email_verified: true,
            verification_expiry: verificationExpiry,
            role: role,
          };

          if (role === 'student') {
            insertData.course_taken = course;
          }

        const { data: insertUser, error: dbError } = await supabase.from(table).insert([insertData]);
  
        if (dbError) {
          setLoading(false);
          navigate('/');
          return toast({
            title: 'Signup not Successful',
            description: dbError.message || 'Please Try Again!',
          });
        }
  
        // Update user context after successful signup
        // setUserData({
        //   id: user.id,
        //   user_id: userId,
        //   fname: firstName,
        //   lname: lastName,
        //   email: email,
        //   profile_photo: publicUrl || null,
        //   role: studentIdPattern.test(userId) && studentEmailPattern(userId).test(email) ? 'student' :
        //   facultyIdPattern.test(userId) && facultyEmailPattern(userId).test(email) ? 'faculty' : 'admin', // 'student', 'faculty', or 'admin'
        // });


        sessionStorage.setItem('userData', JSON.stringify({
          id: user.id,
          user_id: userId,
          fname: firstName,
          lname: lastName,
          email: email,
          profile_photo: publicUrl || null,
          role: studentIdPattern.test(userId) && studentEmailPattern(userId).test(email) ? 'student' :
          facultyIdPattern.test(userId) && facultyEmailPattern(userId).test(email) ? 'faculty' : 'admin',
        }));

        
  
        navigate('/');
        toast({
          title: 'Signup Successful',
          description: 'Welcome to CampusEase!',
        });
        
       } else {
         toast({
           title: 'Signup Failed',
           description: 'An error occurred during signup. Please try again.',
           variant: 'destructive',
         });
      }
    } catch (error: any) {
      toast({
        title: 'Signup Failed',
        description: error.message || 'An error occurred during signup',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to determine the table based on the user role
  const determineTableBasedOnRole = (userId: string, email: string) => {
    if (studentIdPattern.test(userId) && studentEmailPattern(userId).test(email)) {
      return 'users'; // Student
    } else if (facultyIdPattern.test(userId) && facultyEmailPattern(userId).test(email)) {
      return 'faculty'; // Faculty
    } else if (adminIdPattern.test(userId) && adminEmailPattern(userId).test(email)) {
      return 'admin'; // Admin
    } else {
      return 'users'; // Default to 'users' for 'user' role
    }
  };


  

  const handleSkip = () => {
    handleSignup();
  };

  return (
    <div className="min-h-screen bg-campus-gradient flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black">Join CampusEase</h1>
          <p className="text-lg text-black/90 mt-2">Create an account to get started</p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {step === 1 ? 'Sign Up' : 'Add Profile Photo'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="userId" className="text-sm font-medium">ID Number</label>
                  <Input
                    id="userId"
                    placeholder="S12345678"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-campus-blue hover:bg-campus-dark-blue text-black"
                >
                  Next Step
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-4">
                  <div className="w-32 h-32 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    {photoPreview ? (
                      <img 
                        src={photoPreview} 
                        alt="Profile Preview" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <p className="text-gray-400">No Photo</p>
                    )}
                  </div>
                  <label htmlFor="photo" className="text-campus-blue hover:underline cursor-pointer">
                    Choose a profile photo
                  </label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPhoto(file);
                          setPhotoPreview(URL.createObjectURL(file));
                        }
                      }}
                      
                    />
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={handleSignup}
                    className="flex-1 bg-campus-blue hover:bg-campus-dark-blue text-black"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Complete Signup'}
                  </Button>
                </div>

                <Button
                  type="button"
                  onClick={handleSkip}
                  variant="ghost"
                  className="w-full"
                  disabled={loading}
                >
                  Skip this step
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/" className="text-campus-blue hover:underline font-medium">
                Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Signup;