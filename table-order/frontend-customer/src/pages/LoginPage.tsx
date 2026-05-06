import { useState } from 'react'
import { api } from '../utils/api'
import { saveToken } from '../utils/auth'

interface Props {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: Props) {
  const [tableNumber, setTableNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.tableLogin(parseInt(tableNumber), password)
      saveToken(res.token, {
        tableId: res.table_id,
        tableNumber: res.table_number,
        sessionId: res.session_id,
      })
      onLogin()
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-strong mb-4">
            <span className="text-4xl">🍽️</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">테이블오더</h1>
          <p className="text-white/70 mt-2 text-sm">테이블에서 바로 주문하세요</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                테이블 번호
              </label>
              <input
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white text-lg font-medium text-gray-800 placeholder-gray-400 transition-all"
                placeholder="1"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white text-lg font-medium text-gray-800 placeholder-gray-400 transition-all"
                placeholder="••••"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 rounded-2xl">
                <span className="text-red-500 text-sm">⚠️</span>
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-warm text-white font-bold rounded-2xl transition-all disabled:opacity-50 text-lg shadow-glow hover:shadow-xl active:scale-[0.98]"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  접속 중...
                </span>
              ) : '시작하기'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          테이블 비밀번호는 직원에게 문의해주세요
        </p>
      </div>
    </div>
  )
}
