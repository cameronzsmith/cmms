// NPM plugins
import React from 'react';
import Link from 'next/link';

const ButtonLink = React.forwardRef(({ className, href, hrefAs, children, prefetch }, ref) => (
    <Link href={href} as={hrefAs} prefetch ref={ref}> 
        <a className={className}>
            {children}
        </a>
    </Link>
));

export default ButtonLink;