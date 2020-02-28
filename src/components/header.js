import Head from 'next/head';

const Header = () => (
    <div>
        <Head>
            <title>CMMS Application</title>

            <link href="https://fonts.googleapis.com/css?family=Open+Sans&display=swap" rel="stylesheet"></link>
        </Head>
        <style>{`
            * {
                padding: 0;
                margin: 0;
                font-family: 'Open Sans', sans-serif;
            }
            html, body {
                width: 100%;
                height: 100%;
                margin: 0;
            }
            a {
                color: #000;
                text-decoration: none;
            }
            a:hover, a:focus, a:visited {
                font-weight: bold;
            }
            .profile a {
                line-height: 65px;
             }
        `}
        </style>
    </div>
);
  
export default Header;