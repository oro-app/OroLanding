import './SmsBubble.css'

export default function SmsBubble({ children, tone = 'cream', side = 'left', className = '' }) {
  return (
    <div className={`sms-bubble sms-bubble--${tone} sms-bubble--${side} ${className}`.trim()}>
      {children}
    </div>
  )
}
