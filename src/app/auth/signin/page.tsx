import { redirect } from 'next/navigation'

// Redirect signin to login for consistency
export default function SignInPage() {
  redirect('/auth/login')
}