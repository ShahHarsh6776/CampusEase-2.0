import * as React from 'react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Bell, AlertTriangle, MapPin, Phone, Shield, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

interface EmergencyAlert {
  id: number;
  title: string;
  description: string;
  type: 'critical' | 'warning' | 'advisory' | 'info';
  location?: string;
  time: string;
  active: boolean;
}

const emergencyAlerts: EmergencyAlert[] = [
  {
    id: 1,
    title: "Severe Weather Warning",
    description: "Thunderstorm with potential for heavy rain and strong winds expected this evening. Stay indoors if possible.",
    type: "warning",
    time: "2023-10-18T14:30:00",
    active: true
  },
  {
    id: 2,
    title: "Campus Power Outage",
    description: "North Campus buildings experiencing power outage. Maintenance team is working to restore power. Expected resolution by 2:00 PM.",
    type: "advisory",
    location: "North Campus - Science & Engineering Buildings",
    time: "2023-10-18T10:15:00",
    active: true
  },
  {
    id: 3,
    title: "IT System Maintenance",
    description: "Student portal will be down for scheduled maintenance tonight from 12 AM - 2 AM.",
    type: "info",
    time: "2023-10-17T16:45:00",
    active: false
  },
  {
    id: 4,
    title: "Security Incident",
    description: "Reports of suspicious activity near the west parking garage. Campus security has increased patrols in the area.",
    type: "warning",
    location: "West Parking Garage",
    time: "2023-10-16T22:10:00",
    active: false
  }
];

const emergencyContacts = [
  { name: "Campus Security", phone: "555-123-4567", available: "24/7" },
  { name: "Student Health Center", phone: "555-123-8910", available: "8 AM - 6 PM" },
  { name: "Counseling Services", phone: "555-123-1112", available: "9 AM - 5 PM" },
  { name: "Facility Services", phone: "555-123-1314", available: "8 AM - 5 PM" },
  { name: "IT Help Desk", phone: "555-123-1516", available: "8 AM - 10 PM" }
];

const EmergencyAlerts = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-red-500" />
            Emergency Alerts
          </h1>
          
          <Button variant="destructive" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Emergency Contacts
          </Button>
        </div>
        
        {/* Current Alerts Banner */}
        {emergencyAlerts.some(alert => alert.active && alert.type === 'critical') && (
          <Alert className="bg-red-50 border-red-300 mb-6">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-600">Critical Alert</AlertTitle>
            <AlertDescription>
              There is an active emergency situation on campus. Follow instructions from campus officials.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="border-red-100">
              <CardHeader className="border-b border-red-100 bg-red-50">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Active Alerts
                </CardTitle>
                <CardDescription>
                  Current emergency notifications and important alerts affecting campus
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {emergencyAlerts.filter(alert => alert.active).length > 0 ? (
                    emergencyAlerts
                      .filter(alert => alert.active)
                      .map(alert => (
                        <div 
                          key={alert.id} 
                          className={`p-4 rounded-md border ${
                            alert.type === 'critical' ? 'bg-red-50 border-red-200' : 
                            alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                            alert.type === 'advisory' ? 'bg-blue-50 border-blue-200' :
                            'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold flex items-center gap-2">
                              {alert.title}
                              <Badge className={`
                                ${alert.type === 'critical' ? 'bg-red-100 text-red-700' : ''}
                                ${alert.type === 'warning' ? 'bg-yellow-100 text-yellow-700' : ''}
                                ${alert.type === 'advisory' ? 'bg-blue-100 text-blue-700' : ''}
                                ${alert.type === 'info' ? 'bg-gray-100 text-gray-700' : ''}
                              `}>
                                {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                              </Badge>
                            </h3>
                            <span className="text-xs text-gray-500">
                              {new Date(alert.time).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{alert.description}</p>
                          {alert.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <MapPin className="h-3 w-3" /> {alert.location}
                            </div>
                          )}
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-6">
                      <Shield className="mx-auto h-12 w-12 text-green-300 mb-4" />
                      <h3 className="text-xl font-semibold mb-2 text-green-600">All Clear</h3>
                      <p className="text-gray-600">
                        There are no active emergency alerts at this time.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t border-red-100 bg-red-50">
                <Button variant="outline" className="w-full">View Alert History</Button>
              </CardFooter>
            </Card>
          </div>
          
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-red-500" />
                  Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emergencyContacts.map((contact, index) => (
                    <div key={index} className="flex justify-between items-start pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-gray-500">{contact.available}</p>
                      </div>
                      <Button variant="link" className="text-red-600 p-0 h-auto">
                        {contact.phone}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button variant="destructive" className="w-full mb-2">
                  Call 911 (Emergency)
                </Button>
                <p className="text-xs text-center text-gray-500">
                  For life-threatening emergencies, always call 911 first
                </p>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-campusblue-500" />
                  Safety Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="mr-2 h-4 w-4" />
                  Campus Map & Safety Zones
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  Emergency Procedures
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Safety Training Videos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Tabs defaultValue="alerts">
          <TabsList className="w-full md:w-auto mb-6">
            <TabsTrigger value="alerts">Alert History</TabsTrigger>
            <TabsTrigger value="safety">Safety Tips</TabsTrigger>
            <TabsTrigger value="settings">Alert Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Previous Alerts</CardTitle>
                <CardDescription>
                  History of recent emergency notifications and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emergencyAlerts
                    .filter(alert => !alert.active)
                    .map(alert => (
                      <div 
                        key={alert.id} 
                        className="p-4 rounded-md border border-gray-200 bg-gray-50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{alert.title}</h3>
                          <Badge className="bg-gray-100 text-gray-600">Resolved</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{new Date(alert.time).toLocaleString()}</span>
                          {alert.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {alert.location}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Load More History</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="safety">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weather Emergencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Monitor local weather reports and emergency notifications.</li>
                    <li>During severe weather, move to interior rooms on the lowest floor.</li>
                    <li>Stay away from windows during storms.</li>
                    <li>Follow evacuation orders if issued.</li>
                    <li>Have emergency supplies ready.</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Campus Safety</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Be aware of your surroundings at all times.</li>
                    <li>Use campus escort services when walking at night.</li>
                    <li>Keep your belongings secured and in sight.</li>
                    <li>Report suspicious activities to campus security.</li>
                    <li>Save emergency contacts in your phone.</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Fire Safety</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Know the evacuation routes from your building.</li>
                    <li>When a fire alarm sounds, evacuate immediately.</li>
                    <li>Use stairs, not elevators, during fire emergencies.</li>
                    <li>If trapped, call 911 and signal for help from windows.</li>
                    <li>Stay low to avoid smoke inhalation.</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Medical Emergencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Call 911 for life-threatening emergencies.</li>
                    <li>Contact campus health services for non-critical situations.</li>
                    <li>Learn basic first aid and CPR.</li>
                    <li>Know the location of AEDs (Automated External Defibrillators).</li>
                    <li>Keep important medical information accessible.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Alert Preferences</CardTitle>
                <CardDescription>
                  Customize how you receive emergency notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Notification Methods</h3>
                    <div className="space-y-2">
                      {['Email', 'SMS/Text', 'Push Notifications', 'Phone Call'].map(method => (
                        <div key={method} className="flex items-center justify-between">
                          <label htmlFor={`method-${method}`} className="text-sm">{method}</label>
                          <input 
                            type="checkbox" 
                            id={`method-${method}`} 
                            className="h-4 w-4"
                            defaultChecked={['Email', 'SMS/Text', 'Push Notifications'].includes(method)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">Alert Types</h3>
                    <div className="space-y-2">
                      {[
                        'Critical Emergencies', 
                        'Weather Warnings', 
                        'Campus Safety', 
                        'Building/Facility Issues',
                        'IT System Outages',
                        'Academic Notifications'
                      ].map(type => (
                        <div key={type} className="flex items-center justify-between">
                          <label htmlFor={`type-${type}`} className="text-sm">{type}</label>
                          <input 
                            type="checkbox" 
                            id={`type-${type}`} 
                            className="h-4 w-4"
                            defaultChecked={!['IT System Outages', 'Academic Notifications'].includes(type)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label htmlFor="email" className="text-sm">Email Address</label>
                        <Input id="email" type="email" defaultValue="student@university.edu" />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="phone" className="text-sm">Mobile Phone</label>
                        <Input id="phone" type="tel" defaultValue="(555) 123-4567" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-4">
                <Button variant="outline">Cancel</Button>
                <Button>Save Preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default EmergencyAlerts;
