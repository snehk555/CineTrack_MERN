
import { create } from "zustand";

const useAuthStore =  create((set) => ({
          
         user: null,
         isCheckingAuth: true, // at  page start checking is true

         setUser: (user) => set({user}),
         // when page is refresh then 
         checkAuth: async () => {

           try  {
            const response = await fetch("http://localhost:8000/api/auth/authCheck",{
                 credentials: 'include'
             });
             const data =  await response.json();
             if(response.ok){
                 set({user: data.user, isCheckingAuth: false})
             }
             else{
                 set({user: null, isCheckingAuth: false})
             }
             }
             catch(error){

                 set({user: null, isCheckingAuth: false})
             }

                 
         },
         logout: async () => {
            try{
                 await fetch("http://localhost:8000/api/auth/logout",{
                     method: "POST",
                     credentials: "include"
                 });
                 set({user: null})
            }
            catch(error){
                 console.log("logout failed", error)
            }
         }

     
}))
export default useAuthStore;