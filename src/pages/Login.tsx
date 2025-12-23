import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/supabase/supabaseClient';
import { Eye, EyeOff } from 'lucide-react';
import { useUser } from '@/UserContext';


const Login = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setUserData } = useUser();


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!userId || !password) {
      toast({
        title: "Error",
        description: "Please fill out all fields",
        variant: "destructive"
      });
      return;
    }
  
    setLoading(true);
  
    try {
      // Step 1: Check ID format and determine role
      let role = '';
      let tableName = '';
      let email = '';
  
      const studentIdPattern = /^[2][0-5](dit|dce|dcs|it|ce|cs)\d{3}$/i;
      const facultyIdPattern = /^fac_(dit|dce|dcs|it|ce|cs)\d{3}$/i;
      const adminIdPattern = /^admin\d{3}$/i;

      const studentEmailPattern = (id: string) => new RegExp(`^${id}@charusat.edu.in$`, 'i');
      const facultyEmailPattern = (id: string) => new RegExp(`^${id}@charusat.ac.in$`, 'i');
      const adminEmailPattern = (id: string) => new RegExp(`^${id}_ad@charusat.ac.in$`, 'i');

      // Generate default password for students (e.g., 23DIT001@23)
      const generateDefaultPassword = (studentId: string) => {
        const year = studentId.substring(0, 2);
        return `${studentId}@${year}`;
      };

      if (studentIdPattern.test(userId)) {
        // Handle STUDENT LOGIN with default password support
        role = 'student';
        
        console.log('Student login attempt for user:', userId);
        
        // First, check if student exists in student_records (added by admin)
        const { data: studentRecord, error: studentError } = await supabase
          .from('student_records')
          .select('*')
          .eq('user_id', userId)
          .single();

        console.log('Student record lookup result:', { studentRecord, studentError });

        if (studentError || !studentRecord) {
          console.error('Student record not found:', studentError);
          throw new Error("Student ID not found. Please contact admin to add your record first.");
        }

        // Use email from student record or generate it
        email = studentRecord.email || `${userId}@charusat.edu.in`;
        const defaultPassword = generateDefaultPassword(userId);
        
        console.log('Generated email:', email);
        console.log('Generated default password:', defaultPassword);
        console.log('Entered password matches default:', password === defaultPassword);
        console.log('Account activation status:', studentRecord.account_activated);

        // Check if this is a default password attempt
        if (password === defaultPassword) {
          console.log('Attempting default password authentication...');
          
          // First, try to login with default password (in case account already exists)
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password: defaultPassword,
          });

          if (authError) {
            // Account doesn't exist in auth.users, try to create it
            if (authError.message?.includes('Invalid login credentials')) {
              console.log('Auth account not found, creating new account...');
              
              // Check if auth_id is already set (account might exist but password changed)
              if (studentRecord.auth_id) {
                throw new Error("Your account already exists but password has been changed. Please use your new password or contact admin.");
              }
              
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password: defaultPassword,
                options: {
                  emailRedirectTo: undefined // Skip email confirmation for student accounts
                }
              });

              if (signUpError) {
                // Handle specific signup errors
                if (signUpError.message?.includes('User already registered')) {
                  // User exists in auth but password is different
                  throw new Error("Account already exists with different password. Please use your updated password or contact admin for reset.");
                } else {
                  throw new Error(`Failed to create account: ${signUpError.message}`);
                }
              }

              // Successfully created account
              if (signUpData.user) {
                // Update student record with auth_id and activation status
                const { error: updateError } = await supabase
                  .from('student_records')
                  .update({ 
                    auth_id: signUpData.user.id,
                    account_activated: false, // Still using default password
                    email_verified: true 
                  })
                  .eq('user_id', userId);

                if (updateError) {
                  console.error('Failed to update student record:', updateError);
                }

                toast({
                  title: "Welcome!",
                  description: "Logged in with default password. Please change your password in profile settings for security.",
                });
              }
            } else {
              throw new Error("Authentication failed: " + authError.message);
            }
          } else {
            // Successfully logged in with existing account
            console.log('Successfully authenticated with default password');
            
            // Update account activation status if needed
            if (studentRecord.account_activated !== false) {
              await supabase
                .from('student_records')
                .update({ account_activated: false })
                .eq('user_id', userId);
            }
          }
        } else {
          // Not default password, try regular login
          console.log('Attempting regular password authentication...');
          
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authError) {
            console.log('Regular login failed:', authError.message);
            
            // If regular login fails, provide helpful error message
            if (authError.message?.includes('Invalid login credentials')) {
              // Check if they should use default password
              if (!studentRecord.account_activated) {
                throw new Error(`Incorrect password. Try your default password: ${defaultPassword}\nYou can change it after logging in.`);
              } else {
                throw new Error("Invalid password. If you forgot your password, please contact admin for reset.");
              }
            } else {
              throw new Error("Login failed: " + authError.message);
            }
          } else {
            // Successfully logged in with custom password
            console.log('Successfully authenticated with custom password');
            
            // Mark account as activated since they're using custom password
            if (!studentRecord.account_activated) {
              await supabase
                .from('student_records')
                .update({ account_activated: true })
                .eq('user_id', userId);
            }
          }
        }

        // Set user data for student
        setUserData({
          id: studentRecord.id,
          user_id: studentRecord.user_id,
          fname: studentRecord.fname,
          lname: studentRecord.lname,
          email: studentRecord.email,
          profile_photo: studentRecord.profile_photo || null,
          course_taken: studentRecord.course_taken,
          mobile_num: studentRecord.mobile_num,
          address: studentRecord.address,
          dob: studentRecord.dob,
          emergency_contact: studentRecord.emergency_contact,
          class_id: studentRecord.class_id,
          role: 'student'
        });

      } else if (facultyIdPattern.test(userId)) {
        // Handle FACULTY LOGIN (existing logic)
        tableName = 'faculty';
        role = 'faculty';
        
        const { data: userData, error: userError } = await supabase
          .from(tableName)
          .select('*')
          .ilike('user_id', userId)
          .maybeSingle();

        if (!userData) {
          throw new Error("Faculty ID not found");
        }

        email = userData.email;

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          throw new Error("Invalid credentials");
        }

        setUserData({
          id: userData.id,
          user_id: userData.user_id,
          fname: userData.fname,
          lname: userData.lname,
          email: userData.email,
          profile_photo: userData.profile_photo,
          course_taken: userData.course_taken,
          mobile_num: userData.mobile_num,
          address: userData.address,
          dob: userData.dob,
          emergency_contact: userData.emergency_contact,
          role: 'faculty'
        });

      } else if (adminIdPattern.test(userId)) {
        // Handle ADMIN LOGIN (existing logic)
        tableName = 'admin';
        role = 'admin';
        
        const { data: userData, error: userError } = await supabase
          .from(tableName)
          .select('*')
          .ilike('user_id', userId)
          .maybeSingle();

        if (!userData) {
          throw new Error("Admin ID not found");
        }

        email = userData.email;

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          throw new Error("Invalid credentials");
        }

        setUserData({
          id: userData.id,
          user_id: userData.user_id,
          fname: userData.fname,
          lname: userData.lname,
          email: userData.email,
          profile_photo: userData.profile_photo,
          course_taken: userData.course_taken,
          mobile_num: userData.mobile_num,
          address: userData.address,
          dob: userData.dob,
          emergency_contact: userData.emergency_contact,
          role: 'admin'
        });

      } else {
        throw new Error("Invalid ID format");
      }
  
      sessionStorage.setItem('isLoggedIn', 'true');
      toast({
        title: "Login Successful",
        description: "Welcome back to CampusEase!",
      });
      navigate("/Index");
  
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-campus-gradient flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black">Welcome Back</h1>
          <p className="text-lg text-black/90 mt-2">Sign in to continue to CampusEase</p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-black font-bold text-center">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="userId" className="text-sm font-medium">ID Number</label>
                <Input
                  id="userId"
                  placeholder="Enter your ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <Link to="/forgot-password" className="text-sm text-campus-blue hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Show default password hint for students */}
                {userId && /^[2][0-5](dit|dce|dcs|it|ce|cs)\d{3}$/i.test(userId) && (
                  <div className="text-xs text-blue-600 mt-1 p-2 bg-blue-50 rounded">
                    <strong>New Students:</strong> Use default password: <code className="bg-white px-1 rounded">{userId}@{userId.substring(0, 2)}</code>
                    <br />
                    <span className="text-gray-600">You can change this password in your profile after logging in.</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-campus-blue hover:bg-campus-dark-blue text-black"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-campus-blue hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
