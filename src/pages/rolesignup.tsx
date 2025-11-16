import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const SignupRole = () => {
  const [selectedRole, setSelectedRole] = useState<string | undefined>();
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selectedRole) {
      navigate('/signup', { state: { selectedRole } });

    }
  };

  return (
    <div className="min-h-screen bg-campus-gradient flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black">Join CampusEase</h1>
          <p className="text-lg text-black/90 mt-2">Select your role to continue</p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-black font-bold text-center">I am a...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={selectedRole} onValueChange={setSelectedRole}>
              <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-gray-50" onClick={() => setSelectedRole('student')}>
                <RadioGroupItem value="student" id="student" />
                <label htmlFor="student" className="text-lg font-medium flex-1 cursor-pointer">Student</label>
              </div>
              
              <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-gray-50" onClick={() => setSelectedRole('faculty')}>
                <RadioGroupItem value="faculty" id="faculty" />
                <label htmlFor="faculty" className="text-lg font-medium flex-1 cursor-pointer">Faculty</label>
              </div>
              
              <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-gray-50" onClick={() => setSelectedRole('admin')}>
                <RadioGroupItem value="admin" id="admin" />
                <label htmlFor="admin" className="text-lg font-medium flex-1 cursor-pointer">College Admin</label>
              </div>
            </RadioGroup>

            <Button
              onClick={handleContinue}
              disabled={!selectedRole}
              className="w-full bg-campus-blue hover:bg-campus-dark-blue text-black"
            >
              Continue
            </Button>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <a href="/login" className="text-campus-blue hover:underline font-medium">
                  Log in
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignupRole;
