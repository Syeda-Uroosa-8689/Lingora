import React, { useEffect, useState } from "react";
import "./FavouritePlaceActivity3Intro.css";

function FavouritePlaceActivity3Intro({ onFinish }) {
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
    <div className="favourite-place-intro-container">
      <div
        className={
          show
            ? "favourite-place-intro-popup show"
            : "favourite-place-intro-popup"
        }
      >
        <h1>
          Tell Us About
          <br />
          Your Favourite Place
        </h1>
      </div>
    </div>
  );
}

export default FavouritePlaceActivity3Intro;
