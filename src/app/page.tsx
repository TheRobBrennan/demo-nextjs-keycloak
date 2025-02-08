import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'
import Login from '../components/Login'
import Logout from '../components/Logout'
import { isSystemAdmin, isResearcher } from '@/utils/auth'
import Link from 'next/link'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    return (
      <div className='flex flex-col space-y-3 justify-center items-center h-screen'>
        <div>Your name is {session.user?.name}</div>
        <div>Your roles: {session.roles?.join(', ') || 'No roles assigned'}</div>
        {isSystemAdmin(session) && (
          <div>
            <Link
              href="/admin"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              Go to Admin Dashboard
            </Link>
          </div>
        )}
        {isResearcher(session) && (
          <div>
            <Link
              href="/researcher"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              Upload Research Files
            </Link>
          </div>
        )}
        <div>
          <Logout />
        </div>
      </div>
    )
  }

  return (
    <div className='flex justify-center items-center h-screen'>
      <Login />
    </div>
  )
}
