import {Composition} from "remotion";
import {Scene} from "./Scene";

export const RemotionRoot: React.FC = () => <Composition id="OroLaunch" component={Scene} fps={30} durationInFrames={450} width={1280} height={720} />;
