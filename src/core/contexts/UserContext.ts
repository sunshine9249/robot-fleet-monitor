import React from "react";
import { useUser } from "../hooks/useUser";

export const UserContext = React.createContext<ReturnType<typeof useUser>>({
  user: null,
  setUser: () => {},
  logout: () => Promise.reject(),
  reload: () => Promise.reject(),
  loading: false,
  error: null,
  errorResponse: null,
});
