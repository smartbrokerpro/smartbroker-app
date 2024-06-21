// context/UpdateContext.js

import React, { createContext, useContext, useState } from 'react';

const UpdateContext = createContext();

export const UpdateProvider = ({ children }) => {
  const [updateCount, setUpdateCount] = useState(0);

  const incrementUpdateCount = () => {
    setUpdateCount(updateCount + 1);
  };

  return (
    <UpdateContext.Provider value={{ updateCount, incrementUpdateCount }}>
      {children}
    </UpdateContext.Provider>
  );
};

export const useUpdateContext = () => useContext(UpdateContext);
