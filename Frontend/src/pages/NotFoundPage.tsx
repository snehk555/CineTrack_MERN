import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="text-center py-24 text-white">
      <h1 className="text-8xl mb-2 font-bold">404</h1>
      <h2 className="text-2xl mb-2">Oops! Page Not Found</h2>
      <p className="text-slate-400 mb-8">
        The page you are looking for does not exist.
      </p>
      <Link to="/" className="bg-violet-600 text-white no-underline px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:bg-violet-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/30">
        Go Back Home
      </Link>
    </div>
  )
}
export default NotFoundPage