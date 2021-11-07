
interface Vector2 { x: number, y: number }
interface Ray { point: Vector2, direction: Vector2; }
interface Intersect extends Vector2 {
    distance: number;
    angle?: number;
}

interface Segment {
    point1: Vector2, point2: Vector2;
}

export default class Lighting2DIntersection {

    // Find intersection of RAY & SEGMENT
    private static getIntersection(ray: Ray, point1: Vector2, point2: Vector2): Intersect {
        // RAY in parametric: Point + Delta*T1
        let r_px = ray.point.x;
        let r_py = ray.point.y;
        let r_dx = ray.direction.x;
        let r_dy = ray.direction.y;

        // SEGMENT in parametric: Point + Delta*T2
        let s_px = point1.x;
        let s_py = point1.y;
        let s_dx = point2.x - point1.x;
        let s_dy = point2.y - point1.y;

        // Are they parallel? If so, no intersect
        let r_mag = Math.sqrt(r_dx * r_dx + r_dy * r_dy);
        let s_mag = Math.sqrt(s_dx * s_dx + s_dy * s_dy);
        if (r_dx / r_mag == s_dx / s_mag && r_dy / r_mag == s_dy / s_mag) {
            // Unit vectors are the same.
            return null;
        }

        // SOLVE FOR T1 & T2
        // r_px+r_dx*T1 = s_px+s_dx*T2 && r_py+r_dy*T1 = s_py+s_dy*T2
        // ==> T1 = (s_px+s_dx*T2-r_px)/r_dx = (s_py+s_dy*T2-r_py)/r_dy
        // ==> s_px*r_dy + s_dx*T2*r_dy - r_px*r_dy = s_py*r_dx + s_dy*T2*r_dx - r_py*r_dx
        // ==> T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx)
        let T2 = (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) / (s_dx * r_dy - s_dy * r_dx);
        let T1 = (s_px + s_dx * T2 - r_px) / r_dx;

        // Must be within parametic whatevers for RAY/SEGMENT
        if (T1 < 0) return null;
        if (T2 < 0 || T2 > 1) return null;

        // Return the POINT OF INTERSECTION
        return {
            x: r_px + r_dx * T1,
            y: r_py + r_dy * T1,
            distance: T1
        };
    }

    /**
     * @link {https://blog.csdn.net/qq592116366/article/details/50674822}
     */
    private static lineSegmentIntersecCircleSqDistance(p1: Vector2, p2: Vector2, pc: Vector2): number {
        let v1x = pc.x - p1.x;
        let v1y = pc.y - p1.y;
        let v2x = p2.x - p1.x;
        let v2y = p2.y - p1.y;
        let len = Math.sqrt(v2x * v2x + v2y * v2y);
        v2x /= len;
        v2y /= len;
        // u is the vector projection length of vector p1 onto vector p2.
        let u = v1x * v2x + v1y * v2y;
        // determine ther nearest point on the line segment
        let x, y;
        if (u <= 0) {
            // p is on the left of p1, so p1 is the nearest point on line segment.
            x = p1.x, y = p1.y;
        } else if (u >= len) {
            // p is on the right of p2. so p2 is the nearest pont on line segment.
            x = p2.x, y = p2.y;
        } else {
            // p = p1 + v2 * u
            x = p1.x + v2x * u;
            y = p1.y + v2y * u;
        }
        x = pc.x - x;
        y = pc.y - y;
        return x * x + y * y;
    }

    private static getSquaredDistance(point1: Vector2, point2: Vector2): number {
        let x = point2.x - point1.x;
        let y = point2.y - point1.y;
        return x * x + y * y;
    }

    private static getSegments(polygons: Vector2[][], sightPoint: Vector2, radius: number): Segment[] {
        let sqRadius = radius * radius;
        let segments: Segment[] = [];
        for (let points of polygons) {
            for (let i = 0; i < points.length; i++) {
                let point1 = points[i];
                let point2 = points[(i + 1) % points.length];
                if (radius == Infinity)
                    segments.push({ point1, point2 });
                // else if (points == polygons[0] || Lighting2DIntersection.getSquaredDistance(point1, sightPoint) <= sqRadius || Lighting2DIntersection.getSquaredDistance(point2, sightPoint) <= sqRadius)
                else if (points == polygons[0] || Lighting2DIntersection.lineSegmentIntersecCircleSqDistance(point1, point2, sightPoint) <= sqRadius)
                    segments.push({ point1, point2 });
            }
        }
        return segments;
    }

    private static getUniquePoints(segments: Segment[]): Vector2[] {
        let set = {};
        let filter = function (p: Vector2) {
            let key = p.x + "," + p.y;
            if (key in set) {
                return false;
            } else {
                set[key] = true;
                return true;
            }
        }
        let points: Vector2[] = [];
        for (let segment of segments) {
            if (filter(segment.point1))
                points.push(segment.point1);
            if (filter(segment.point2))
                points.push(segment.point2);
        }
        return points;
    }

    public static getSightPolygon(polygons: Vector2[][], sightPoint: Vector2, radius: number): Vector2[] {

        // Get all unique points
        let segments = Lighting2DIntersection.getSegments(polygons, sightPoint, radius);
        let uniquePoints = Lighting2DIntersection.getUniquePoints(segments);

        // console.log("segments", segments.length, segments, uniquePoints.length, uniquePoints);

        // Get all angles
        let uniqueAngles: number[] = [];
        for (let j = 0; j < uniquePoints.length; j++) {
            let uniquePoint = uniquePoints[j];
            let angle = Math.atan2(uniquePoint.y - sightPoint.y, uniquePoint.x - sightPoint.x);
            uniqueAngles.push(angle - 0.00001, angle, angle + 0.00001);
        }

        // RAYS IN ALL DIRECTIONS
        let intersects: Intersect[] = [];
        for (let j = 0; j < uniqueAngles.length; j++) {
            let angle = uniqueAngles[j];

            // Calculate dx & dy from angle
            let dx = Math.cos(angle);
            let dy = Math.sin(angle);

            // Ray from center of screen to mouse
            let ray: Ray = { point: sightPoint, direction: { x: dx, y: dy } };

            // Find CLOSEST intersection
            let closestIntersect: Intersect = null;
            for (let segment of segments) {
                // for (let i = 0; i < segment.length; i++) {
                // let ni = (i + 1) % segment.length;
                let intersect = Lighting2DIntersection.getIntersection(ray, segment.point1, segment.point2);
                if (!intersect) continue;
                if (!closestIntersect || intersect.distance < closestIntersect.distance) {
                    closestIntersect = intersect;
                }
                // }
            }

            // Intersect angle
            if (!closestIntersect) continue;
            closestIntersect.angle = angle;

            // Add to list of intersects
            intersects.push(closestIntersect);
        }

        // Sort intersects by angle
        intersects = intersects.sort(function (a, b) { return a.angle - b.angle; });

        // Polygon is intersects, in order of angle
        return intersects;
    }
}