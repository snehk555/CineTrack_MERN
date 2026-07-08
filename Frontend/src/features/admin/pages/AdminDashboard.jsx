
import AdminSidebar from "../component/AdminSidebar";


const AdminDashboard = () => {


  return (
    <div className="flex min-h-screen bg-[#09090f]">

      <AdminSidebar />

     <main className="ml-[260px] flex-1 px-10 py-12 w-full">
    <h1 className="text-3xl font-bold text-white">Welcome to Dashboard</h1>
    <p className="text-slate-400 mt-2"> Here we show the status  </p>
</main>

     

    </div>
  )
}

export default AdminDashboard;
