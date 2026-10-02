import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

export const navigateFromNotification = (data = {}) => {
  if (!navigationRef.isReady()) return;

  if (data.orderId) {
    navigationRef.navigate("OrderDetails", { orderId: data.orderId });
    return;
  }

  navigationRef.navigate("Notifications");
};
