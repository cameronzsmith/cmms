import dynamic from "next/dynamic";www

const LoginPage = dynamic(() => import("./login"));
// more imports here

function PrivatePage({ loggedIn, ...props }) {
  // some hooks here that need to be before the condition
  if (!loggedIn) return <LoginPage />;
  // the JSX the private page will render
}

// define getInitialProps here
PrivatePage.getInitialProps = async context => {
    const { sessions } = readCookies(context.req);
    if (!session) return { loggedIn: false };
    // the code required for your private page
  };

export default PrivatePage;