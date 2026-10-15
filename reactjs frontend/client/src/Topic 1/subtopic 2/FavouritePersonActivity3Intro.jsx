import React, { useEffect, useState } from "react";
import "./FavouritePersonActivity2Intro.css";

function FavouritePersonActivity3Intro({ onFinish }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShow(true);
    }, 100);

    const hideTimer = setTimeout(() => {
      setShow(false);

      const finishTimer = setTimeout(() => {
        onFinish?.();
      }, 300);

      return () => clearTimeout(finishTimer);
    }, 1500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onFinish]);

  return (
    <div className="favourite-person-intro-container">
      <div
        className={
          show
            ? "favourite-person-intro-popup show"
            : "favourite-person-intro-popup"
        }
      >
      

        <h1>
           Favourite Person Memory Game
        </h1>

      </div>
    </div>
  );
}

export default FavouritePersonActivity3Intro;