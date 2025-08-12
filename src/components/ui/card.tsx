import { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const Card = ({ children, className = '', ...props }: CardProps) => {
  const classes = `bg-white rounded-xl shadow-soft border border-gray-100 ${className}`
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

const CardHeader = ({ children, className = '', ...props }: CardHeaderProps) => {
  const classes = `p-6 pb-4 ${className}`
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

const CardTitle = ({ children, className = '', ...props }: CardTitleProps) => {
  const classes = `text-lg font-semibold text-gray-900 ${className}`
  
  return (
    <h3 className={classes} {...props}>
      {children}
    </h3>
  )
}

const CardContent = ({ children, className = '', ...props }: CardContentProps) => {
  const classes = `p-6 pt-0 ${className}`
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

export { Card, CardHeader, CardTitle, CardContent }