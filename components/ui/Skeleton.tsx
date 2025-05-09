// components/ui/Skeleton.tsx
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface Props {
  count?: number;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export default function UISkeleton(props: Props) {
  return <Skeleton {...props} />;
}
