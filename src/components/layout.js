import Header from './header';

const layoutStyle = {
    border: '1px solid #ddd'
};

const Layout = props => (
    <div style={layoutStyle}>
        <Header />
        {props.children}
    </div>
);

export default Layout;