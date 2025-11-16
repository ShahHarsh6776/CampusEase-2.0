
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Users, Search, Briefcase, GraduationCap, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface JobPosting {
  id: number;
  title: string;
  company: string;
  location: string;
  jobType: 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
  salary?: string;
  postedDate: string;
  deadline: string;
  description: string;
  requirements: string[];
  logo: string;
}

const jobPostings: JobPosting[] = [
  {
    id: 1,
    title: "Software Engineer Intern",
    company: "TechCorp Solutions",
    location: "Remote / On Campus",
    jobType: "Internship",
    salary: "$25-30/hr",
    postedDate: "2023-10-15",
    deadline: "2023-11-30",
    description: "Join our engineering team to develop new features for our flagship product. Work with experienced developers in an agile environment.",
    requirements: ["Computer Science major", "Knowledge of JavaScript", "Basic understanding of data structures"],
    logo: "/placeholder.svg"
  },
  {
    id: 2,
    title: "Research Assistant - Biology Lab",
    company: "University Research Department",
    location: "Science Building, Room 302",
    jobType: "Part-time",
    salary: "$20/hr",
    postedDate: "2023-10-12",
    deadline: "2023-11-15",
    description: "Assist with ongoing research projects in microbiology. Help with experiments, data collection, and analysis.",
    requirements: ["Biology major", "Lab experience", "Available 15 hours/week"],
    logo: "/placeholder.svg"
  },
  {
    id: 3,
    title: "Marketing Coordinator",
    company: "Global Brands Inc.",
    location: "Downtown - 3 miles from campus",
    jobType: "Full-time",
    salary: "$50,000 - $60,000/year",
    postedDate: "2023-10-10",
    deadline: "2023-12-01",
    description: "Help plan and execute marketing campaigns for our clients. Looking for creative individuals with strong communication skills.",
    requirements: ["Marketing or Business major", "Social media experience", "Graphic design skills a plus"],
    logo: "/placeholder.svg"
  },
  {
    id: 4,
    title: "Student Ambassador",
    company: "University Admissions Office",
    location: "On Campus",
    jobType: "Part-time",
    salary: "$15/hr",
    postedDate: "2023-10-08",
    deadline: "2023-11-05",
    description: "Represent the university to prospective students and their families. Lead campus tours and assist with admissions events.",
    requirements: ["Min. GPA 3.0", "Excellent communication skills", "Knowledge of campus resources"],
    logo: "/placeholder.svg"
  },
  {
    id: 5,
    title: "Data Analyst",
    company: "FinTech Innovations",
    location: "Hybrid - 10 miles from campus",
    jobType: "Full-time",
    salary: "$65,000 - $75,000/year",
    postedDate: "2023-10-05",
    deadline: "2023-11-20",
    description: "Analyze financial data and create reports for clients. Identify trends and provide insights to help with decision-making.",
    requirements: ["Statistics or Finance major", "Proficient in Excel and SQL", "Data visualization experience"],
    logo: "/placeholder.svg"
  }
];

const Recruitments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobType, setSelectedJobType] = useState<string | null>(null);
  
  const filteredJobs = jobPostings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedJobType ? job.jobType === selectedJobType : true;
    
    return matchesSearch && matchesType;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedJobType(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-campusblue-500" />
          Campus Recruitments
        </h1>
        
        <div className="mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input 
              className="pl-10" 
              placeholder="Search for jobs, companies, or keywords..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="jobs">
            <TabsList className="w-full md:w-auto mb-6">
              <TabsTrigger value="jobs">Job Listings</TabsTrigger>
              <TabsTrigger value="events">Career Events</TabsTrigger>
              <TabsTrigger value="resources">Career Resources</TabsTrigger>
              <TabsTrigger value="internships">Internships</TabsTrigger>
            </TabsList>
            
            <TabsContent value="jobs">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="md:w-64 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-4 w-4" /> Filters
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Job Type</h3>
                        <div className="space-y-2">
                          {(['Full-time', 'Part-time', 'Internship', 'Contract'] as const).map(type => (
                            <div key={type} className="flex items-center">
                              <input 
                                type="checkbox" 
                                id={`job-type-${type}`} 
                                className="mr-2"
                                checked={selectedJobType === type}
                                onChange={() => setSelectedJobType(selectedJobType === type ? null : type)}
                              />
                              <label htmlFor={`job-type-${type}`} className="text-sm">{type}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Location</h3>
                        <div className="space-y-2">
                          {['On Campus', 'Remote', 'Hybrid'].map(location => (
                            <div key={location} className="flex items-center">
                              <input type="checkbox" id={`location-${location}`} className="mr-2" />
                              <label htmlFor={`location-${location}`} className="text-sm">{location}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Button variant="outline" className="w-full" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" /> Quick Apply
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">
                        Upload your resume to quickly apply to multiple positions.
                      </p>
                      <Button className="w-full">Upload Resume</Button>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex-1">
                  <div className="space-y-6">
                    {filteredJobs.length > 0 ? (
                      filteredJobs.map(job => (
                        <Card key={job.id}>
                          <CardHeader className="flex flex-row items-start gap-4 pb-2">
                            <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                              <img src={job.logo} alt={job.company} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <CardTitle>{job.title}</CardTitle>
                              <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                                <span>{job.company}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{job.location}</span>
                              </CardDescription>
                            </div>
                            <Badge className={`
                              ${job.jobType === 'Full-time' ? 'bg-green-100 text-green-800' : ''}
                              ${job.jobType === 'Part-time' ? 'bg-blue-100 text-blue-800' : ''}
                              ${job.jobType === 'Internship' ? 'bg-purple-100 text-purple-800' : ''}
                              ${job.jobType === 'Contract' ? 'bg-orange-100 text-orange-800' : ''}
                            `}>
                              {job.jobType}
                            </Badge>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm mb-4">
                              {job.salary && <div><span className="font-medium">Salary:</span> {job.salary}</div>}
                              <div><span className="font-medium">Posted:</span> {new Date(job.postedDate).toLocaleDateString()}</div>
                              <div><span className="font-medium">Deadline:</span> {new Date(job.deadline).toLocaleDateString()}</div>
                            </div>
                            
                            <p className="text-sm mb-4">{job.description}</p>
                            
                            <div className="mb-2">
                              <span className="text-sm font-medium">Requirements:</span>
                              <ul className="list-disc list-inside text-sm pl-2 mt-1">
                                {job.requirements.map((req, index) => (
                                  <li key={index}>{req}</li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between gap-4 flex-wrap">
                            <Button variant="outline">Save Job</Button>
                            <Button>Apply Now</Button>
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
                        <p className="text-gray-600 mb-6">
                          Try adjusting your search or filters to find more opportunities.
                        </p>
                        <Button onClick={clearFilters}>Clear All Filters</Button>
                      </div>
                    )}
                  </div>
                  
                  {filteredJobs.length > 0 && (
                    <div className="flex justify-center mt-8">
                      <Button variant="outline">Load More Jobs</Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="events">
              <div className="text-center py-12">
                <Briefcase className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Career Events & Job Fairs</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Find upcoming career fairs, networking events, and recruitment drives.
                </p>
                <Button>View Events Calendar</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="resources">
              <div className="text-center py-12">
                <Briefcase className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Career Development Resources</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Access resume templates, interview tips, and career counseling services.
                </p>
                <Button>Browse Resources</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="internships">
              <div className="text-center py-12">
                <Briefcase className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Internship Programs</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Explore internship opportunities curated specifically for students.
                </p>
                <Button>View Internships</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Recruitments;
