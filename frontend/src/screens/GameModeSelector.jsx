import React, {useState, useEffect} from 'react';
import styles from '../styles/GameModeSelector.module.css';
import ArrowLeftIcon from '../assets/arrowLeft.png';
import bot from '../assets/bot.png';
import users from '../assets/users.png';
import userPlus from '../assets/usersPlus.png';
import { useNavigate

 } from 'react-router-dom';
const GameModeSelector = () => {

    const navigate = useNavigate();
    const gameModes = [
        {
            id: 'ai',
            icon: 'bot', 
            title: 'vs AI Bot',
            description: 'Practice against our intelligent AI with adjustable difficulty',
            buttonText: 'Play vs AI'
        },
        {
            id: 'human',
            icon: 'users', 
            title: 'vs Human',
            description: 'Get matched with players of similar skill level online',
            buttonText: 'Find Opponent'
        },
        {
            id: 'friend',
            icon: 'userPlus',
            title: 'Invite Friend',
            description: 'Create a private game and invite your friends to play',
            buttonText: 'Invite Friend'
        }
    ];

    const handleModeSelect = (mode) => {
        switch(mode){
            case 'human':
                navigate('/game');
                return;
            case 'ai':

                return;
            case 'friend':

                return;
        }
    }

    const renderIcon = (iconType) => {
        switch(iconType) {
            case 'bot': return <img src= {bot} className={`${styles.icon} ${styles[iconType]}`}></img>;
            case 'users': return <img src= {users} className={`${styles.icon} ${styles[iconType]}`}></img>;
            case 'userPlus': return <img src= {userPlus} className={`${styles.icon} ${styles[iconType]}`}></img>;
            default: return null;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <button 
                    className={styles.backButton}
                >
                    <img src = {ArrowLeftIcon} className={styles.backIcon}></img> 
                    <span>Back to Dashboard</span>
                </button>

                <div className={styles.header}>
                <h1 className={styles.title}>
                    Choose Your Game Mode
                </h1>
                <p className={styles.subtitle}>
                    How would you like to play today?
                </p>
                </div>

                <div className={styles.gameModesGrid}>
                {gameModes.map((mode) => (
                    <div
                        key={mode.id}
                        className={styles.gameModeCard}
                    >
                        <div className={styles.iconContainer}>
                            <div className={styles.iconWrapper}>
                                {renderIcon(mode.icon)}
                            </div>
                        </div>

                        <h2 className={styles.cardTitle}>
                            {mode.title}
                        </h2>

                        <p className={styles.cardDescription}>
                            {mode.description}
                        </p>

                        <button
                            onClick={() => handleModeSelect(mode.id)}
                            className={styles.actionButton}
                        >
                            {mode.buttonText}
                        </button>
                        
                    </div>
                ))}
                </div>
            </div>
        </div>
    );
};

export default GameModeSelector;