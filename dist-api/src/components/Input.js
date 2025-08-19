import { forwardRef } from 'react';
const Input = forwardRef(({ label, error, variant = 'default', className = '', ...props }, ref) => {
    const baseClasses = 'w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none';
    const variantClasses = {
        default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-300',
        elegant: 'border-elegant-200 focus:border-elegant-500 focus:ring-elegant-300 bg-white'
    };
    const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-300' : '';
    const classes = `${baseClasses} ${variantClasses[variant]} ${errorClasses} ${className}`;
    return (<div className="w-full">
      {label && (<label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>)}
      <input ref={ref} className={classes} {...props}/>
      {error && (<p className="mt-1 text-sm text-red-600">{error}</p>)}
    </div>);
});
Input.displayName = 'Input';
export default Input;
