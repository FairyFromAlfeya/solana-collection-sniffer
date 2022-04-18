import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { dateColumnTransformer } from '../../utils/convert.util';
import { CollectionStatus } from '../interfaces/collection-status.interface';

@Entity({ name: 'collections' })
export class Collection {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column()
  name?: string;

  @Index({ unique: true })
  @Column()
  address?: string;

  @Column('numeric', { nullable: true })
  floor?: number;

  @Column({ name: 'floor_nft', nullable: true })
  floorNft?: string;

  @Column('varchar', { array: true, default: [] })
  nfts?: string[];

  @Column('enum', {
    enum: CollectionStatus,
    default: CollectionStatus.COLLECTION_STATUS_CREATED,
  })
  status?: CollectionStatus;

  @CreateDateColumn({
    transformer: dateColumnTransformer,
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt?: string;

  @UpdateDateColumn({
    transformer: dateColumnTransformer,
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt?: string;

  @DeleteDateColumn({
    transformer: dateColumnTransformer,
    name: 'removed_at',
    type: 'timestamptz',
  })
  removedAt?: string;
}
