import * as React from 'react';
import { useEffect, useState } from 'react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/supabase/supabaseClient';
import { useUser } from '@/UserContext'; // <-- Context import

const CourseCard = ({ course }) => (
  <Card className="h-full hover:shadow-md transition-all">
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-xl">{course.course_name}</CardTitle>
          <CardDescription className="text-campusblue-500 font-medium mt-1">{course.course_code}</CardDescription>
        </div>
        <span className="bg-campusblue-100 text-campusblue-700 px-2 py-1 rounded-md text-xs font-medium">
          {course.credit ?? 'N/A'} Credits
        </span>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-gray-700">Instructor</p>
          <p className="font-medium">{course.course_instructor}</p>
        </div>
      </div>
      <p className="mt-4 text-gray-600 text-sm line-clamp-3">{course.course_description}</p>
    </CardContent>
    <CardFooter>
      <Button className="w-full bg-campusblue-500 hover:bg-campusblue-600">View Details</Button>
    </CardFooter>
  </Card>
);

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { userData } = useUser(); // <- Get user from context

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError('');

      const department = userData?.course_taken;

      if (!department) {
        setError('User department not found');
        setLoading(false);
        return;
      }

      try {
        const { data: coursesData, error: courseError } = await supabase
          .from('course')
          .select('*')
          .eq('department', department);

        if (courseError) {
          throw courseError;
        }

        setCourses(coursesData);
      } catch (err) {
        console.error('Error fetching courses:', err.message);
        setError('Error fetching courses');
      }

      setLoading(false);
    };

    fetchCourses();
  }, [userData]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Courses</h1>
          <p className="text-gray-600">Courses available for your department</p>
        </div>

        {loading ? (
          <p>Loading courses...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : courses.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium mb-2">No Courses Found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              There are no courses available for your department at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Courses;
