import { useEffect, useRef, useState } from "react";

import { Dimensions, Keyboard, Platform } from "react-native";

const useKeyboardInset = () => {
  const [inset, setInset] = useState(0);

  const initialHeight = useRef(Dimensions.get("window").height);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return undefined;
    }

    const showSubscription = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        const windowHeight = Dimensions.get("window").height;
        const keyboardHeight = event.endCoordinates.height || 0;

        // Window already resized (softwareKeyboardLayoutMode: "resize")
        const windowResized =
          windowHeight <= initialHeight.current - keyboardHeight / 2;

        setInset(windowResized ? 0 : keyboardHeight);
      },
    );

    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setInset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return inset;
};

export default useKeyboardInset;
