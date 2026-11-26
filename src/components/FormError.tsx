import { DEMO_MESSAGE } from '../auth/demo'

type FormErrorProps = {
  message: string
  className?: string
}

export default function FormError({ message, className = 'mx-6 mb-4' }: FormErrorProps) {
  const isDemoNotice = message === DEMO_MESSAGE

  return (
    <div
      role={isDemoNotice ? 'status' : 'alert'}
      className={`${className} rounded-lg border p-3 text-sm ${
        isDemoNotice
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {message}
    </div>
  )
}