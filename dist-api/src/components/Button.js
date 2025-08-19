const Button = ({ variant = 'primary', size = 'md', children, isLoading = false, gradient = false, className = '', disabled, ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 focus:ring-2 focus:ring-offset-2 shadow-elegant hover:shadow-elegant-lg transform hover:scale-105';
    const variantClasses = {
        primary: gradient
            ? 'bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white focus:ring-primary-300'
            : 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-300',
        secondary: 'bg-white hover:bg-primary-50 text-elegant-700 border border-primary-200 focus:ring-primary-300',
        accent: 'bg-secondary-500 hover:bg-secondary-600 text-white focus:ring-secondary-300',
        danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-300',
        elegant: 'bg-elegant-800 hover:bg-elegant-700 text-white focus:ring-elegant-300'
    };
    const sizeClasses = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
        xl: 'px-10 py-5 text-xl'
    };
    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${(disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`;
    return (<button className={classes} disabled={disabled || isLoading} {...props}>
      {isLoading && (<div className="mr-2 animate-spin">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        </div>)}
      {children}
    </button>);
};
export default Button;
export { Button };
