import { Component } from './component';
import { IDisplayComponent } from '../displaySystem';
import { SpriteComponent } from './spriteComponent';
import * as GraphicsAPI from '../graphicsAPI';
import { SpriteSheetComponent } from './spriteSheetComponent';
import { IEntity } from '../entity';

let GL: WebGLRenderingContext;

const INDICES_PER_RECT = 6;

// # Classe *LayerComponent*
// Ce composant représente un ensemble de sprites qui
// doivent normalement être considérées comme étant sur un
// même plan.
export class LayerComponent extends Component<Object> implements IDisplayComponent {

  private layerSprites: SpriteComponent[] = [];
  private spriteLists: SpriteComponent[][] = [];

  private numberOfSprites: number = 0;

  private vertexBuffer!: WebGLBuffer;
  private indexBuffer!: WebGLBuffer;

  // ## Méthode *display*
  // La méthode *display* est appelée une fois par itération
  // de la boucle de jeu.
  display(_dT: number) {
    this.layerSprites = [];
    this.listSprites();
    if (this.layerSprites.length === 0) return;
    const spriteSheet = this.layerSprites[0].spriteSheet;
    GL = GraphicsAPI.context;

    this.sortSprites(this.layerSprites);
    this.initBuffers();
    this.insertDataInBuffers();
    this.draw(spriteSheet);
  }

  /* ------------------------------------------------------------------------- */

  // ## Fonction *listSprites*
  // Cette fonction retourne une liste comportant l'ensemble
  // des sprites de l'objet courant et de ses enfants.
  private listSprites() {
    return this.walkChildren(this.owner, 0);
  }

  private walkChildren(parent: IEntity, i: number) {
    parent.walkChildren(child => {
      if (!child.active) return;
      // Dirty
      if (i < 2) this.walkChildren(child, ++i);

      child.walkComponent(comp => {
        if (comp instanceof SpriteComponent && comp.enabled)
          this.layerSprites.push(comp);
      });
    });
  }

  /* ------------------------------------------------------------------------- */

  // Groupe les différents sprites de `layerSprites` en fonction de leurs caractéristiques
  private sortSprites(layerSprites: SpriteComponent[]) {
    this.spriteLists = [];
    const spriteNames = this.getSpritesByName(layerSprites);

    this.initEmptyLists(spriteNames);
    this.insertSpritesInLists(spriteNames, layerSprites);
  }

  // Distingue tous les sprites par nom dans une liste
  private getSpritesByName(layerList: SpriteComponent[]): string[] {
    let list: string[] = [];
    layerList.forEach(sprite => {
      if (list.length === 0) list.push(sprite.spriteName);
      if (!list.includes(sprite.spriteName))
        list.push(sprite.spriteName);
    });
    return list;
  }

  // Crée une liste vide pour chaque élément existant dans spriteList
  private initEmptyLists(spriteNames: string[]) {
    spriteNames.forEach( () => { this.spriteLists.push([]); } );
  }

  // Insertion des sprites dans les listes en fonction de leur nom
  private insertSpritesInLists(spriteNames: string[], layerSprites: SpriteComponent[]) {
    layerSprites.forEach(sprite => {
      let index = spriteNames.indexOf(sprite.spriteName);
      this.spriteLists[index].push(sprite);
    });
  }

  /* ------------------------------------------------------------------------- */

  // Initie les différents buffers pour le contexte de rendu
  private initBuffers() {
    this.vertexBuffer = GL.createBuffer()!;
    GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);

    this.indexBuffer = GL.createBuffer()!;
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  }

  // Insère dans les buffers les données des sprites rangées au préalable
  private insertDataInBuffers() {
    let vertexData: Float32Array[] = [];
    let indexData: Uint16Array[] = [];
    let indexOffset: number = 0;
    this.numberOfSprites = 0;

    this.spriteLists.forEach(sprites => {
      vertexData.push(this.getVerticesFrom(sprites));
      indexData.push(this.getIndicesFrom(sprites, indexOffset));
      indexOffset += sprites.length;
    });

    GL.bufferData(GL.ARRAY_BUFFER, this.concatFloat32Array(vertexData), GL.DYNAMIC_DRAW);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, this.concatUint16Array(indexData), GL.DYNAMIC_DRAW);
  }

  // Récupère tous les vertices du groupe de sprites
  private getVerticesFrom(sprites: SpriteComponent[]): Float32Array {
    let vertices: Float32Array[] = [];
    for (let i = 0; i < sprites.length; i++, this.numberOfSprites++)
      vertices.push(sprites[i].getVertices());
    return this.concatFloat32Array(vertices);
  }

  // Récupère tous les indices du groupe de sprites
  private getIndicesFrom(sprites: SpriteComponent[], indexOffset: number): Uint16Array {
    let indices: Uint16Array[] = [];
    for (let i = 0; i < sprites.length; i++) {
      const localOffset = 4 * i;
      const bufferOffset = 4 * indexOffset;
      const offset = localOffset + bufferOffset;
      indices.push(new Uint16Array([
        0 + offset,
        1 + offset,
        2 + offset,
        2 + offset,
        3 + offset,
        0 + offset
      ]));
    }
    return this.concatUint16Array(indices);
  }

  /* ------------------------------------------------------------------------- */

  // Concatène en un seul Array un ensemble de TypedArrays
  private concatFloat32Array(arrays: Float32Array[]): Float32Array {
    let tempFloatArray: Float32Array = new Float32Array();
    arrays.forEach(array => {
      tempFloatArray = [].concat.apply(tempFloatArray, array);
    });
    return new Float32Array(tempFloatArray.slice(1));
  }

  // Concatène en un seul Array un ensemble de TypedArrays
  private concatUint16Array(arrays: Uint16Array[]): Uint16Array {
    let tempFloatArray: Uint16Array = new Uint16Array();
    arrays.forEach(array => {
      tempFloatArray = [].concat.apply(tempFloatArray, array);
    });
    return new Uint16Array(tempFloatArray.slice(1));
  }

  /* ------------------------------------------------------------------------- */

  // Effectue l'appel de rendu
  private draw(spriteSheet: SpriteSheetComponent) {
    spriteSheet.bind();
    GL.drawElements(GL.TRIANGLES, INDICES_PER_RECT * this.numberOfSprites, GL.UNSIGNED_SHORT, 0);
    spriteSheet.unbind();
  }

}