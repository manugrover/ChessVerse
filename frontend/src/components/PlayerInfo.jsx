import React from 'react';
import styles from '../styles/PlayerInfo.module.css';

const PlayerInfo = ({ player, isOpponent, isCurrentTurn }) => {
  const getTurnText = () => {
    if (isOpponent) {
      return "Opponent's Turn";
    } else {
      return "Your Turn";
    }
  };

  return (
    <div className={`${styles.playerInfo} ${isOpponent ? styles.opponent : styles.user}`}>
      <h3 className={styles.label}>{isOpponent ? 'Opponent' : 'You'}</h3>
      <h2 className={styles.username}>{player.username}</h2>
      <p className={styles.rating}>Rating: {player.rating}</p>
      <div className={styles.statusContainer}>
        <span className={`${styles.status} ${isCurrentTurn ? styles.activeTurn : styles.inactiveTurn}`}>
          {getTurnText()}
        </span>
      </div>
    </div>
  );
};

export default PlayerInfo;