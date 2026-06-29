import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

const MOCK_USERS = [
  { id: '1', name: 'مدير النظام', phone: '+966500000004', email: 'admin@glamour.sa', role: 'admin', staffId: null, password: 'admin123' },
  { id: '2', name: 'سارة الأحمدي', phone: '+966500000002', email: 'sara@glamour.sa', role: 'staff', staffId: '1', password: 'admin123' },
  { id: '3', name: 'نورة القحطاني', phone: '+966500000003', email: 'noura@glamour.sa', role: 'staff', staffId: '2', password: 'admin123' },
]

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null
        try {
          const result = await pool.query(
            `SELECT u.id, u.name, u.phone, u.email, u.role, u.password_hash, st.id AS staff_id
             FROM users u
             LEFT JOIN staff st ON st.user_id = u.id
             WHERE u.phone = $1 AND u.role IN ('admin','staff') AND u.is_active = true`,
            [credentials.phone]
          )
          const user = result.rows[0]
          if (user) {
            const valid = user.password_hash
              ? await bcrypt.compare(credentials.password as string, user.password_hash)
              : credentials.password === 'admin123'
            if (!valid) return null
            return { id: user.id, name: user.name, email: user.email, role: user.role, staffId: user.staff_id }
          }
        } catch (err) {
          console.error('DB unavailable, falling back to mock users:', (err as Error).message)
        }

        const mock = MOCK_USERS.find(u => u.phone === credentials.phone && u.password === credentials.password)
        if (mock) return { id: mock.id, name: mock.name, email: mock.email, role: mock.role, staffId: mock.staffId ?? undefined }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.role = (user as any).role; token.id = user.id; token.staffId = (user as any).staffId }
      return token
    },
    async session({ session, token }) {
      if (session.user) { (session.user as any).role = token.role; (session.user as any).id = token.id; (session.user as any).staffId = token.staffId }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
})
