import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(() => {
    const storedData = sessionStorage.getItem("userData");
    return storedData
      ? JSON.parse(storedData)
      : {
          id: '',
          user_id: '',
          fname: '',
          lname: '',
          email: '',
          course_taken:'',
          mobile_num:'',
          dob:'',
          address:'',
          emergency_contact:'',
          profile_photo: '',
          role: '',
        };
  });

  useEffect(() => {
    sessionStorage.setItem("userData", JSON.stringify(userData));
  }, [userData]); 

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
