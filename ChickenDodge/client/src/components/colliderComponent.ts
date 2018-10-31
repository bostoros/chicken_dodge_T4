import { Component, IComponent } from './component';
import { PositionComponent } from './positionComponent';
import { ILogicComponent } from '../logicSystem';
import { Rectangle } from './rectangle';
import * as Quadtree from '../../../../ChickenDodge/client/node_modules/quadtree-lib/typings/quadtree';



export interface ICollisionComponent extends IComponent {
  onCollision(other: ColliderComponent): void;
}

// ## Variable *colliders*
// On conserve ici une référence vers toutes les instances
// de cette classe, afin de déterminer si il y a collision.
const colliders: ColliderComponent[] = [];
const height = 768;
const width = 576




// # Classe *ColliderComponent*
// Ce composant est attaché aux objets pouvant entrer en
// collision.
interface ISize {
  w: number;
  h: number;
}


interface IColliderComponentDesc {
  flag: number;
  mask: number;
  size: ISize;
  handler?: string;
}

export class ColliderComponent extends Component<IColliderComponentDesc> implements ILogicComponent {

  static id = 0;
  //private myid = ColliderComponent.id++;
  private myPotentialColliders: ColliderComponent[] = [];

  private debugDisplayControl : number = 0;
  private flag!: number;
  private mask!: number;
  private size!: ISize;
  public handler?: ICollisionComponent;
  private active = true;
  public quadCollider!: Quadtree.QuadtreeItem;
  static quadtree = new Quadtree({
    width: width,
    height: height,
    maxElements: 3
  })
  /*
  framedLog(message : string){
    if(this.debugDisplayControl++ > 30){
      console.log(message);
      this.debugDisplayControl = 0;
    }
  }*/
  // ## Méthode *create*
  // Cette méthode est appelée pour configurer le composant avant
  // que tous les composants d'un objet aient été créés.
  create(descr: IColliderComponentDesc) {
    this.flag = descr.flag;
    this.mask = descr.mask;
    this.size = descr.size;
  }

  // ## Méthode *setup*
  // Si un type *handler* est défini, on y appellera une méthode
  // *onCollision* si une collision est détectée sur cet objet.
  // On stocke également une référence à l'instance courante dans
  // le tableau statique *colliders*.
  // On stock aussi la position dans le quadtree
  setup(descr: IColliderComponentDesc) {
    this.debugDisplayControl = 0;
    const position =this.owner.getComponent<PositionComponent>('Position').worldPosition;
    if (descr.handler) {
      this.handler = this.owner.getComponent<ICollisionComponent>(descr.handler);
    }
    this.quadCollider ={
      x:position[0],
      y:position[1],
      width: this.size.w,  
      height: this.size.h,
      //saveid: this.myid,
      collider : this
    }
    colliders.push(this);    
    ColliderComponent.quadtree.push(this.quadCollider,true);
  }


  // ## Méthode *update*
  //permet de vérifier les collisions en faisant appele au quadtreeCollision
  update() {
    const position =this.owner.getComponent<PositionComponent>('Position').worldPosition;
    this.quadCollider.x=position[0];
    this.quadCollider.y=position[1];

    if (!this.handler) {
      return;
    }

    this.checkQuadCollision();
    const area = this.area;
  }

  // ## Propriété *area*
  // Cette fonction calcule l'aire courante de la zone de
  // collision, après avoir tenu compte des transformations
  // effectuées sur les objets parent.
  get area() {
    const position = this.owner.getComponent<PositionComponent>('Position').worldPosition;
    return new Rectangle({
      x: position[0],
      y: position[1],
      width: this.size.w,
      height: this.size.h,
    });
  }

    // ## Méthode *TestCollision*
  // À chaque itération, on vérifie si l'aire courante est en
  // intersection avec l'aire de chacune des autres instances.
  // Si c'est le cas, on appelle sa méthode *onCollision* avec l'objet qui est en
  // collision.
  TestCollision(other : ColliderComponent){
      if (other === this ||
        !other.enabled ||
        !other.owner.active||!(this.mask&other.flag)) {
        return;
      }
      if (this.area.intersectsWith(other.area)) {
        this.handler!.onCollision(other);  
      }
  }

  // ## Méthode *checkQuadCollision*
  // permet de comparer les elements du quadtree et de tester leurs collisions
  // si nécessaire
  checkQuadCollision(){
    var message : string;
    // message = "x:" + ColliderComponent.quadtree.where({saveid:0})[0].x;
    //message += "\n" + "y:" + ColliderComponent.quadtree.where({saveid:0})[0].y;
      var elementsToTestCollisions = ColliderComponent.quadtree.colliding(this.quadCollider);

      elementsToTestCollisions.forEach(element => {
        if(element.collider != null)
        {
          this.TestCollision(element.collider);
        }
      });

    }
    
}
