import {FC} from "react";
import type { ReactNode } from 'react';


interface RenderIfProps {
  isTrue: boolean;
  children: ReactNode;
}

const RenderIf: FC<RenderIfProps> = ({ isTrue, children }) => {
  return isTrue ? <>{children}</> : <></>;
};

export default RenderIf;
