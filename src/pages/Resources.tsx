import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import Sem4 from './sam_4'; // Import the Sem4 component

const semesters = [1, 2, 3, 4, 5, 6];

const Resources = () => {
  const navigate = useNavigate();

  const handleSemesterClick = (sem) => {
    if (sem === 4) {
      navigate('/sem_4'); // Navigate to the route for Semester 4
    } else {
      alert(`Resources for Semester ${sem} are not yet available.`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Campus Resources</h1>
          <p className="text-gray-600">Access academic, library, and software resources</p>
        </div>

        <Tabs defaultValue="library" className="mb-8">
          <TabsList>
            <TabsTrigger value="library">Library Resources</TabsTrigger>
            <TabsTrigger value="software">Software</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {semesters.map((sem) => (
                <Card
                  key={sem}
                  onClick={() => handleSemesterClick(sem)}
                  className="p-6 cursor-pointer border hover:border-campusteal-500 hover:shadow transition-all text-center"
                >
                  <h2 className="text-xl font-semibold text-campusteal-600">Semester {sem}</h2>
                  <p className="text-sm text-gray-500 mt-1">View all resources</p>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="software" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {["MATLAB", "Adobe Creative Cloud", "Microsoft Office 365", "Statistical Tools (SPSS, R, SAS)"].map(
                (title, idx) => (
                  <Card key={idx} className="p-6 border text-center">
                    <h3 className="text-lg font-semibold text-campusteal-600">{title}</h3>
                    <button className="mt-4 px-4 py-1 border rounded text-sm hover:bg-campusteal-50 text-campusteal-600 border-campusteal-200">
                      Download
                    </button>
                  </Card>
                )
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Resources;