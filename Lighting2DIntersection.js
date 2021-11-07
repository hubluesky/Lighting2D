var Lighting2DIntersection = /** @class */ (function () {
    function Lighting2DIntersection() {
    }
    // Find intersection of RAY & SEGMENT
    Lighting2DIntersection.getIntersection = function (ray, point1, point2) {
        // RAY in parametric: Point + Delta*T1
        var r_px = ray.point.x;
        var r_py = ray.point.y;
        var r_dx = ray.direction.x;
        var r_dy = ray.direction.y;
        // SEGMENT in parametric: Point + Delta*T2
        var s_px = point1.x;
        var s_py = point1.y;
        var s_dx = point2.x - point1.x;
        var s_dy = point2.y - point1.y;
        // Are they parallel? If so, no intersect
        var r_mag = Math.sqrt(r_dx * r_dx + r_dy * r_dy);
        var s_mag = Math.sqrt(s_dx * s_dx + s_dy * s_dy);
        if (r_dx / r_mag == s_dx / s_mag && r_dy / r_mag == s_dy / s_mag) {
            // Unit vectors are the same.
            return null;
        }
        // SOLVE FOR T1 & T2
        // r_px+r_dx*T1 = s_px+s_dx*T2 && r_py+r_dy*T1 = s_py+s_dy*T2
        // ==> T1 = (s_px+s_dx*T2-r_px)/r_dx = (s_py+s_dy*T2-r_py)/r_dy
        // ==> s_px*r_dy + s_dx*T2*r_dy - r_px*r_dy = s_py*r_dx + s_dy*T2*r_dx - r_py*r_dx
        // ==> T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx)
        var T2 = (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) / (s_dx * r_dy - s_dy * r_dx);
        var T1 = (s_px + s_dx * T2 - r_px) / r_dx;
        // Must be within parametic whatevers for RAY/SEGMENT
        if (T1 < 0)
            return null;
        if (T2 < 0 || T2 > 1)
            return null;
        // Return the POINT OF INTERSECTION
        return {
            x: r_px + r_dx * T1,
            y: r_py + r_dy * T1,
            distance: T1
        };
    };
    Lighting2DIntersection.lineSegmentIntersecCircleSqDistance = function (p1, p2, pc) {
        var v1x = pc.x - p1.x;
        var v1y = pc.y - p1.y;
        var v2x = p2.x - p1.x;
        var v2y = p2.y - p1.y;
        var len = Math.sqrt(v2x * v2x + v2y * v2y);
        v2x /= len;
        v2y /= len;
        // u is the vector projection length of vector p1 onto vector p2.
        var u = v1x * v2x + v1y * v2y;
        // determine ther nearest point on the line segment
        var x, y;
        if (u <= 0) {
            // p is on the left of p1, so p1 is the nearest point on line segment.
            x = p1.x, y = p1.y;
        }
        else if (u >= len) {
            // p is on the right of p2. so p2 is the nearest pont on line segment.
            x = p2.x, y = p2.y;
        }
        else {
            // p = p1 + v2 * u
            x = p1.x + v2x * u;
            y = p1.y + v2y * u;
        }
        x = pc.x - x;
        y = pc.y - y;
        return x * x + y * y;
    };
    Lighting2DIntersection.getSegments = function (data, sightPoint, radius) {
        var sqRadius = radius * radius;
        var segments = [];
        var foreachPoints = function (points, callback) {
            for (var i = 0; i < points.length; i++) {
                var point1 = points[i];
                var point2 = points[(i + 1) % points.length];
                callback(point1, point2);
            }
        };
        for (var _i = 0, _a = data.polygons; _i < _a.length; _i++) {
            var polygon = _a[_i];
            foreachPoints(polygon, function (point1, point2) {
                if (radius == Infinity)
                    segments.push({ point1: point1, point2: point2 });
                else if (Lighting2DIntersection.lineSegmentIntersecCircleSqDistance(point1, point2, sightPoint) <= sqRadius)
                    segments.push({ point1: point1, point2: point2 });
            });
        }
        foreachPoints(data.border, function (point1, point2) {
            segments.push({ point1: point1, point2: point2 });
        });
        return segments;
    };
    Lighting2DIntersection.getUniquePoints = function (segments) {
        var set = {};
        var filter = function (p) {
            var key = p.x + "," + p.y;
            if (key in set) {
                return false;
            }
            else {
                set[key] = true;
                return true;
            }
        };
        var points = [];
        for (var _i = 0, segments_1 = segments; _i < segments_1.length; _i++) {
            var segment = segments_1[_i];
            if (filter(segment.point1))
                points.push(segment.point1);
            if (filter(segment.point2))
                points.push(segment.point2);
        }
        return points;
    };
    Lighting2DIntersection.getSightPolygon = function (data, sightPoint, radius) {
        // Get all unique points
        var segments = Lighting2DIntersection.getSegments(data, sightPoint, radius);
        var uniquePoints = Lighting2DIntersection.getUniquePoints(segments);
        // Get all angles
        var uniqueAngles = [];
        for (var j = 0; j < uniquePoints.length; j++) {
            var uniquePoint = uniquePoints[j];
            var angle = Math.atan2(uniquePoint.y - sightPoint.y, uniquePoint.x - sightPoint.x);
            uniqueAngles.push(angle - 0.00001, angle, angle + 0.00001);
        }
        // RAYS IN ALL DIRECTIONS
        var intersects = [];
        for (var j = 0; j < uniqueAngles.length; j++) {
            var angle = uniqueAngles[j];
            // Calculate dx & dy from angle
            var dx = Math.cos(angle);
            var dy = Math.sin(angle);
            // Ray from center of screen to mouse
            var ray = { point: sightPoint, direction: { x: dx, y: dy } };
            // Find CLOSEST intersection
            var closestIntersect = null;
            for (var _i = 0, segments_2 = segments; _i < segments_2.length; _i++) {
                var segment = segments_2[_i];
                // for (let i = 0; i < segment.length; i++) {
                // let ni = (i + 1) % segment.length;
                var intersect = Lighting2DIntersection.getIntersection(ray, segment.point1, segment.point2);
                if (!intersect)
                    continue;
                if (!closestIntersect || intersect.distance < closestIntersect.distance) {
                    closestIntersect = intersect;
                }
                // }
            }
            // Intersect angle
            if (!closestIntersect)
                continue;
            closestIntersect.angle = angle;
            // Add to list of intersects
            intersects.push(closestIntersect);
        }
        // Sort intersects by angle
        intersects = intersects.sort(function (a, b) { return a.angle - b.angle; });
        // Polygon is intersects, in order of angle
        return intersects;
    };
    return Lighting2DIntersection;
}());
export default Lighting2DIntersection;
