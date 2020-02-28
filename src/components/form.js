import Link from 'next/link';

const Form = props => (
    <div class="container">
        <Link href="/">
            <a><img src="https://via.placeholder.com/394x104.png?text=Your+Brand+Here" /></a>
        </Link>
        <div class="box">
            {props.children}
        </div>
        <style>{`
            .container {
                background: #f5f5f5;
                text-align: center;
                padding: 10px;
                height: 100vh;
            }
            .container img {
                padding: 10px;
            }
            .box {
                width: 30%;
                margin: auto;
                text-align: center;
                background: #fff;
                border: 1px solid #d6e0eb;
                border-radius: 6px;
                padding: 10px;
            }
            .box h2 {
                font-size: 30px;
                color: #007aff;
            }
            form {
                margin: 30px;
            }
            form div {
                margin: 0;
            }
            form input[type="email"], form input[type="text"], form input[type="password"] {
                padding: 7px;
                width: 80%;
                margin: 0;
                border: 1px solid #d6e0eb;
                outline: none;
            }
            form input[type="text"] {
                border-radius: 6px 6px 0 0;
            }
            form input[type="password"] {
                border-radius: 0 0 6px 6px;
            }
            form input[type="submit"] {
                padding: 10px;
                margin-top: 20px;
                width: 80%;
                background: linear-gradient(#66afff, #007aff);
                color: #fff;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                box-shadow: 2px 2px #99c9ff;
            }
            form input[type="submit"]:hover {
                background: linear-gradient(#007aff, #0055b2);
                box-shadow: 2px 2px #007aff;
            } 
            form p {
                margin: 10px;
            }
            form a {
                color: #007aff;
                text-decoration: none;
                cursor: pointer;
            }
            form a:hover {
                color: #0055b2;
            }
        `}</style>
    </div>
);

export default Form;