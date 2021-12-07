import { Color, Component, Graphics, IVec2, Material, v2, Vec3, _decorator } from "cc";
import Lighting2DIntersection, { LightingPolygons } from "./Lighting2DIntersection";

const { ccclass, property, requireComponent } = _decorator;
@ccclass("Lighting2D")
@requireComponent(Graphics)
export default class Lighting2D extends Component {
    @property
    readonly lightRadius: number = 200;       // 光线半径
    @property
    readonly fadeRadius: number = 30;
    @property
    readonly lightAngle: number = 30;

    protected graphics: Graphics = null;
    private material: Material;

    onLoad() {
        this.graphics = this.getComponent(Graphics);

        this.material = this.graphics.customMaterial;
        this.material.setProperty("lightRadius", this.lightRadius);
        this.material.setProperty("lightRadiusFade", this.fadeRadius);
        this.material.setProperty("lightAngle", this.lightAngle * Math.PI / 180);
    }

    public updateLight(lightingData: LightingPolygons, lightPosition: Vec3, angle: number): void {
        let lightPoint = lightPosition as unknown as IVec2;
        let intersects = Lighting2DIntersection.getSightPolygon(lightingData, lightPoint, this.lightRadius);

        this.material = this.graphics.material;
        angle = angle * Math.DEGREE_TO_RADIAN;
        let direction = v2(Math.cos(angle), Math.sin(angle));
        this.material.setProperty("lightDirection", direction);
        // this.graphics.material = this.material;
        Lighting2D.drawLighting(this.graphics, lightPoint, intersects);

        // Lighting2D.drawDebugLines(this.graphics, "#f55000", lightPoint, intersects);
    }

    public static drawDebugLines(graphics: Graphics, color: string, offset: IVec2, intersects: IVec2[]): void {
        graphics.strokeColor.fromHEX(color);
        for (var i = 0; i < intersects.length; i++) {
            var intersect = intersects[i];
            graphics.moveTo(0, 0);
            graphics.lineTo(intersect.x - offset.x, intersect.y - offset.y);
            graphics.stroke();
        }
    }

    public static drawLighting(graphics: Graphics, offset: IVec2, intersects: IVec2[]): void {
        graphics.clear();
        graphics.moveTo(intersects[0].x - offset.x, intersects[0].y - offset.y);
        for (var i = 1; i < intersects.length; i++) {
            var intersect = intersects[i];
            graphics.lineTo(intersect.x - offset.x, intersect.y - offset.y);
        }
        graphics.fill();
    }
}