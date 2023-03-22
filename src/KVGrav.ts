import Coordinate from "./types/Coordinate";
import CoordiMass from "./types/CoordiMass";
import KvgOptionsType from "./types/KvgOptionsType";

export default class KVGrav {
  set centerCoordinate(value: Coordinate) {
    this._centerCoordinate = value;
  }
  set newton(value: boolean) {
    this._newton = value;
  }

  private _newton = false;
  constructor(
    center: Coordinate | null = null,
    option: KvgOptionsType | null = null
  ) {
    // console.info(`MAX_SAFE_INTEGER ${Math.floor(Number.MAX_SAFE_INTEGER / 1_000_000)}M, MAX_VALUE ${Number.MAX_VALUE}`);
    if (center) this._centerCoordinate = center;
    if (option) this.setOptions(option);
  }

  public setOptions(options: KvgOptionsType) {
    this.transferStrength = options.transferStrength;
    this.powerExtGravitation = options.powerExtGravitation;
    this.radiusExtGravitation = options.radiusExtGravitation;
  }

  private _centerCoordinate: Coordinate = { x: 500, y: 400 };

  private transferStrength: number = 1;
  private radiusExtGravitation: number = 600;
  private powerExtGravitation: number = 10000;
  private power(sourceMass: number, mass: number, distance: number): number {
    // return ((sourceMass + mass) * this.transferStrength) / Math.pow(distance, 2);
    // return (sourceMass / mass * this.transferStrength) / Math.pow(distance, 2);
    return (sourceMass / mass / Math.pow(distance, 2)) * this.transferStrength;
    // return (sourceMass / mass * this.transferStrength) / distance;
    // return ((sourceMass + mass ) - mass)/Math.pow(distance, 2)*this.transferStrength;
  }

  /*
    ā={150-160;100-140}={-10;-40} ---вектор
С= 21/sqrt(10²+40²)--- скаляр на который надо умножить вектор чтоб получить колинеарный вектор с модулем 21
[C*-10,c*-40] колинеарный вектор
Отложить от 2 точки
[150+С*(-10),100+С*(-40)] координаты точки 3.

     */

  private fun2(
    sourceX: number,
    sourceY: number,
    sourceMass: number,
    x: number,
    y: number,
    mass: number
  ): Coordinate {
    const vectorX = x - sourceX;
    const vectorY = y - sourceY;
    const distance = Math.sqrt(Math.pow(vectorX, 2) + Math.pow(vectorY, 2));
    // console.info(`distance ${distance}`);
    const pushback = this.power(sourceMass, mass, distance);
    // console.info(`power ${pushback}`);
    const scalar =
      pushback /
      Math.sqrt(
        // Math.pow( Math.abs(vectorX), 2) + Math.pow(Math.abs(vectorY), 2)
        Math.pow(vectorX, 2) + Math.pow(vectorY, 2)
      );
    // console.info(`scalar ${scalar}`);
    const offsetX = scalar * vectorX;
    const offsetY = scalar * vectorY;
    const newX = this._newton ? x - offsetX : x + offsetX;
    const newY = this._newton ? y - offsetY : y + offsetY;
    // console.info(`newX ${newX}, newY ${newY}`);
    return { x: newX, y: newY };
  }

  private fun3(
    centerX: number,
    centerY: number,
    x: number,
    y: number,
    distance: number
  ): Coordinate {
    const vectorX = x - centerX;
    const vectorY = y - centerY;
    const scalar =
      distance /
      Math.sqrt(
        // Math.pow( Math.abs(vectorX), 2) + Math.pow(Math.abs(vectorY), 2)
        Math.pow(vectorX, 2) + Math.pow(vectorY, 2)
      );
    // console.info(`scalar ${scalar}`);
    // const newX = centerX + scalar * vectorX;
    // const newY = centerY + scalar * vectorY;
    const offsetX = scalar * vectorX;
    const offsetY = scalar * vectorY;
    const newX = this._newton ? centerX - offsetX : centerX + offsetX;
    const newY = this._newton ? centerY - offsetY : centerX + offsetY;
    // console.info(`newX ${newX}, newY ${newY}`);
    return { x: newX, y: newY };
  }

  private avg(coordinates: Array<Coordinate>): Coordinate {
    const length = coordinates.length;
    let x = 0;
    let y = 0;
    for (let i = 0; i < length; i++) {
      x += coordinates[i].x;
      y += coordinates[i].y;
    }
    return { x: x / length, y: y / length };
  }

  calculates(list: Array<CoordiMass>) {
    let preCoordinates: Array<Coordinate> = [];
    list.forEach((item, index) => {
      // console.info( this.dataList[index].name, item);
      const coordinates2 = this.calculate(list, item, index);
      preCoordinates.push({ x: coordinates2.x, y: coordinates2.y });
      // console.info( this.dataList[index].name, this.situations[index]);
    });
    this.setCoordinate(list, preCoordinates);
  }

  private setCoordinate(
    list: Array<CoordiMass>,
    preState: Array<Coordinate>
  ): void {
    list.forEach((item, index) => {
      list[index].coordinate = { x: preState[index].x, y: preState[index].y };
    });
  }

  private calculate(
    listCoordiMass: Array<CoordiMass>,
    target: CoordiMass,
    id: number
  ): Coordinate {
    let preCoordinates: Array<Coordinate> = [];

    const extGravitation = this.fun3(
      this._centerCoordinate.x,
      this._centerCoordinate.y,
      target.coordinate.x,
      target.coordinate.y,
      this.radiusExtGravitation
    );
    // console.info(`CENTER id: ${id}, newX ${extGravitation.x}, newY ${extGravitation.y}`);
    const coordinates2 = this.fun2(
      extGravitation.x,
      extGravitation.y,
      this.powerExtGravitation,
      target.coordinate.x,
      target.coordinate.y,
      target.mass
    );
    preCoordinates.push({ x: coordinates2.x, y: coordinates2.y });

    listCoordiMass.forEach((source, index) => {
      if (id == index) {
        // console.info(`Skip ${id}`)
        return;
      }
      const coordinates = this.fun2(
        source.coordinate.x,
        source.coordinate.y,
        source.mass,
        target.coordinate.x,
        target.coordinate.y,
        target.mass
      );
      preCoordinates.push({ x: coordinates.x, y: coordinates.y });
      // const coordinates2 = this.fun3(this.centerCoordinate.x, this.centerCoordinate.y, target.coordinate.x, target.coordinate.y, 300);
      // console.info(`CENTER id: ${id}, newX ${coordinates2.x}, newY ${coordinates2.y}`);
      // listCoordiMass[id]= {x: coordinate.x, y: coordinate.y, mass: target.mass};
      // console.info(`id: ${id}, X ${target.x}, Y ${target.y}`);
      // console.info(`id: ${id}, newX ${coordinate.x}, newY ${coordinate.y}`);
    });

    // console.info(`id: ${id}`, preCoordinates);
    const avgCoordinates = this.avg(preCoordinates);
    // listCoordiMass[id].coordinate= {x: avgCoordinates.x, y: avgCoordinates.y};
    return { x: avgCoordinates.x, y: avgCoordinates.y };
  }
}