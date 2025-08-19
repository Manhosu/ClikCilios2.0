const Card = ({ children, className = '', ...props }) => {
    const classes = `bg-white rounded-xl shadow-soft border border-gray-100 ${className}`;
    return (<div className={classes} {...props}>
      {children}
    </div>);
};
const CardHeader = ({ children, className = '', ...props }) => {
    const classes = `p-6 pb-4 ${className}`;
    return (<div className={classes} {...props}>
      {children}
    </div>);
};
const CardTitle = ({ children, className = '', ...props }) => {
    const classes = `text-lg font-semibold text-gray-900 ${className}`;
    return (<h3 className={classes} {...props}>
      {children}
    </h3>);
};
const CardContent = ({ children, className = '', ...props }) => {
    const classes = `p-6 pt-0 ${className}`;
    return (<div className={classes} {...props}>
      {children}
    </div>);
};
export { Card, CardHeader, CardTitle, CardContent };
