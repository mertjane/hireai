'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { type Tab } from './types'
import SignInForm from './SignInForm'
import SignUpForm from './SignUpForm'

export default function AuthRightPanel() {
  const [tab, setTab] = useState<Tab>('signin')

  return (
    <div className="w-[480px] bg-[#0D1117] border-l border-white/5 flex items-center justify-center p-10">
      <div className="w-full">
        {/* Tab switcher */}
        <div className="relative flex bg-white/5 rounded-xl p-1 mb-8">
          <motion.div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-lg"
            animate={{ x: tab === 'signin' ? 0 : 'calc(100% + 8px)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          />
          {(['signin', 'signup'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                tab === t ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Animated form swap */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: tab === 'signin' ? -24 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === 'signin' ? 24 : -24 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              {tab === 'signin' ? <SignInForm /> : <SignUpForm />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
