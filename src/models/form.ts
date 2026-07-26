import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Miscellaneous } from './miscellaneous';
import { Member } from './member';

export enum QuestionType {
  TEXT = 'text',
  LONG_TEXT = 'long_text',
  SINGLE = 'single',
  MULTIPLE = 'multiple',
  SELECT = 'select',
  SCALE = 'scale',
  DATE = 'date',
  YES_NO = 'yes_no',
}

export enum ResultsVisibility {
  OWNER = 'owner',
  MEMBERS = 'members',
  PUBLIC = 'public',
}

@Entity('forms')
export class Form {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false })
  anonymous!: boolean;

  @Column({ type: 'varchar', length: 20, default: 'unlimited' })
  response_limit_type!: string; // 'unlimited' | 'once' | 'limited'

  @Column({ type: 'int', nullable: true })
  max_responses_per_user?: number;

  @Column({ type: 'varchar', length: 20, default: ResultsVisibility.OWNER })
  results_visibility!: ResultsVisibility;

  @Column({ type: 'timestamptz', nullable: true })
  start_date?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  end_date?: Date;

  @Column({ type: 'boolean', default: false })
  public_results_enabled!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  public_slug?: string;

  @Column({ type: 'uuid', nullable: true })
  miscellaneous_id?: string;

  @ManyToOne(() => Miscellaneous, { nullable: true })
  @JoinColumn({ name: 'miscellaneous_id' })
  miscellaneous?: Miscellaneous;

  @Column({ type: 'uuid' })
  created_by!: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'created_by' })
  creator!: Member;

  @OneToMany(() => FormQuestion, (q) => q.form)
  questions?: FormQuestion[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}

@Entity('form_questions')
export class FormQuestion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  form_id!: string;

  @ManyToOne(() => Form, (f) => f.questions)
  @JoinColumn({ name: 'form_id' })
  form!: Form;

  @Column({ type: 'varchar', length: 50 })
  type!: QuestionType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false })
  required!: boolean;

  @Column({ type: 'int' })
  position!: number;

  @Column({ type: 'int', nullable: true })
  scale_min?: number;

  @Column({ type: 'int', nullable: true })
  scale_max?: number;

  @OneToMany(() => FormOption, (o) => o.question)
  options?: FormOption[];
}

@Entity('form_options')
export class FormOption {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  question_id!: string;

  @ManyToOne(() => FormQuestion, (q) => q.options)
  @JoinColumn({ name: 'question_id' })
  question!: FormQuestion;

  @Column({ type: 'varchar', length: 255 })
  label!: string;

  @Column({ type: 'int' })
  position!: number;
}

@Entity('form_responses')
export class FormResponse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  form_id!: string;

  @ManyToOne(() => Form)
  @JoinColumn({ name: 'form_id' })
  form!: Form;

  @Column({ type: 'uuid', nullable: true })
  member_id?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'member_id' })
  member?: Member;

  @OneToMany(() => FormAnswer, (a) => a.response)
  answers?: FormAnswer[];

  @CreateDateColumn({ type: 'timestamptz' })
  submitted_at!: Date;
}

@Entity('form_answers')
export class FormAnswer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  response_id!: string;

  @ManyToOne(() => FormResponse, (r) => r.answers)
  @JoinColumn({ name: 'response_id' })
  response!: FormResponse;

  @Column({ type: 'uuid' })
  question_id!: string;

  @ManyToOne(() => FormQuestion)
  @JoinColumn({ name: 'question_id' })
  question!: FormQuestion;

  @Column({ type: 'text', nullable: true })
  value?: string;
}
