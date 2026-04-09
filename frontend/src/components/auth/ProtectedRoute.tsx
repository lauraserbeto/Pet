import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'


interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("petplus_token");
        const userStr = localStorage.getItem("petplus_user");

        if (!token || !userStr) {
          navigate('/login')
          return
        }

        const user = JSON.parse(userStr);

        // O role_id agora vem diretamente do payload de login e fica salvo no local storage
        if (user) {
          // Admin Check
          if (adminOnly && user.role_id !== 1) {
            navigate('/')
            return
          }

          if (user.role_id === 4) {
            const currentPath = window.location.pathname;
            

            const obs = user.onboarding_step || 'INCOMPLETE';

            if (obs === 'INCOMPLETE' || obs === 'REJECTED' || obs === 'IN_REVIEW') {
              if (currentPath !== '/onboarding/sitter') {
                navigate('/onboarding/sitter')
                return
              }
            } else if (obs === 'COMPLETED') {
              if (currentPath === '/onboarding/sitter') {
                navigate('/dashboard')
                return
              }
            }
          }
        }

        setAuthorized(true)
      } catch (error) {
        console.error('Auth check error:', error)
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [navigate, adminOnly])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return authorized ? <>{children}</> : null
}
