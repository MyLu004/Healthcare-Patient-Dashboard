import React from 'react';

import Dashboard from "./pages/dashboard.jsx";
import Login from "./pages/login.jsx";
import Profile from "./pages/profile.jsx";


const App = () => {
  return (
    <main className='max-w-7xl mx-auto relative'>
      <Dashboard />
      {/* <Login />
      <Profile /> */}

    </main>
  );
};

export default App;
