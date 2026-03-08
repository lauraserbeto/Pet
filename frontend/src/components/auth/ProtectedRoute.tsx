import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../../lib/supabase'

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
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          navigate('/login')
          return
        }

        // We now fetch user data for all protected routes to check onboarding status
        const { data: userData } = await supabase
          .from('users')
          .select('role_id, onboarding_step')
          .eq('id', user.id)
          .single()

        if (userData) {
          // Admin Check
          if (adminOnly && userData.role_id !== 1) {
            navigate('/')
            return
          }

          // Pet Sitter Onboarding Check
          if (userData.role_id === 4) {
            const currentPath = window.location.pathname;
            const obs = userData.onboarding_step;

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
