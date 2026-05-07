import React, { useEffect } from 'react';
import './Loader.css';
import { useLoading } from '../context/LoadingContext';
import logoalterd from '../assets/logoalterd.png';
import loader_icon from '../assets/loader_icon.png';

function Loader() {
    const { isLoading } = useLoading();

    useEffect(() => {
        if (isLoading) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isLoading]);

    if (!isLoading) return null;

    return (
        <div className="loader-overlay">
            <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                    src={logoalterd}
                    alt="Loading..."
                    style={{ width: "90px", height: "90px", display: "block" }}
                    className='load'
                />
                <div className="loader-icon-container">
                    <img
                        src={loader_icon}
                        className='loader-icon'
                        alt='icon'
                    />
                </div>
            </div>
        </div>
    );
}

export default Loader;
