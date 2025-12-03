import "~/styles/style.scss";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import UserContext from "lib/UserContext";
import { jwtDecode } from "jwt-decode";
import { Toaster } from "sonner";
import "../lib/i18n";

function SupabaseSlackClone({ Component, pageProps }) {
  const [userLoaded, setUserLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    function saveSession(
      /** @type {Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']} */
      session
    ) {
      setSession(session);
      const currentUser = session?.user;
      if (session) {
        const jwt = jwtDecode(session.access_token);
        currentUser.appRole = jwt.user_role;
      }
      setUser(currentUser ?? null);
      setUserLoaded(!!currentUser);
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        userLoaded,
        user,
        session,
      }}
    >
      <Toaster position="top-center" richColors />
      <Component {...pageProps} />
    </UserContext.Provider>
  );
}
export default SupabaseSlackClone;
