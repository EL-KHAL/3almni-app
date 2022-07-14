import React from 'react';
import {Link} from 'react-router-dom'

import logoImg from '../../assets/images/logo.svg'
import landingImg from '../../assets/images/landing.svg'
import studyIcon from '../../assets/images/icons/study.svg'
import giveClassesIcon from '../../assets/images/icons/give-classes.svg'

import './styles.css'

function Landing() {
    return (
        <div id="page-landing">
            <div id="page-landing-content" className="container">
                <div className="logo-container">
                    <img src={logoImg} alt="3almni" />
                    <h2>Your online live class study platform.</h2>
                </div>

                <img
                    src={landingImg}
                    alt="Plataforme"
                    className="hero-image"
                />

                <div className="buttons-container">
                    <Link to="/study" className="study">
                        <img src={studyIcon} alt="etude"/>
                        Studying
                    </Link>
                    <Link to="/give-classes" className="give-classes">
                        <img src={giveClassesIcon} alt="class"/>
                        Give classes
                    </Link>
                </div>

                <span className="total-connections">
                The First online live class in algeria🇩🇿
                </span>
            </div>
        </div>
    )
}

export default Landing