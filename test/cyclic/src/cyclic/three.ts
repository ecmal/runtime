import Four from "./four";

export class Three {
    public toString(){
        return `Three + ${Four.toString()}`;
    }
}

export default new Three();