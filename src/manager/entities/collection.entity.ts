import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dateColumnTransformer } from '../../utils/convert.util';

@Entity({ name: 'collections' })
export class Collection {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column('numeric')
  floor: number;

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
